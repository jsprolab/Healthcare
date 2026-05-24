'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBookmarks } from '@/components/BookmarkButton';

interface SavedProvider {
  npi: string;
  name: string;
  specialty: string | null;
  city: string | null;
  citySlug: string | null;
  isOrg: boolean;
  acceptsMedicare: boolean;
  telehealth: boolean;
  credentials: string | null;
}

export default function BookmarksPage() {
  const [providers, setProviders] = useState<SavedProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const npis = getBookmarks();
    if (npis.length === 0) {
      setLoading(false);
      return;
    }

    fetch(`/api/bookmarks?npis=${npis.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function remove(npi: string) {
    const current = getBookmarks().filter((n) => n !== npi);
    localStorage.setItem('hn_bookmarks', JSON.stringify(current));
    setProviders((prev) => prev.filter((p) => p.npi !== npi));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-brand-600">
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Saved Providers</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-8 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-7 w-7 text-rose-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">No saved providers yet</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tap the heart icon on any provider profile to save them here.
            </p>
            <Link
              href="/ca"
              className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {providers.length} saved provider{providers.length !== 1 ? 's' : ''}
            </p>
            {providers.map((p) => (
              <div
                key={p.npi}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <img
                  src={`https://api.dicebear.com/9.x/micah/svg?seed=${p.npi}`}
                  alt={p.name}
                  className="h-12 w-12 flex-shrink-0 rounded-full bg-brand-50"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/provider/${p.npi}`}
                      className="font-semibold text-gray-900 hover:text-brand-700"
                    >
                      {p.name}
                    </Link>
                    {p.credentials && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {p.credentials}
                      </span>
                    )}
                    {p.acceptsMedicare && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Medicare
                      </span>
                    )}
                    {p.telehealth && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Telehealth
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {[p.specialty, p.city ? `${p.city}, CA` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Link
                    href={`/provider/${p.npi}`}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => remove(p.npi)}
                    className="rounded-lg border border-rose-100 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
