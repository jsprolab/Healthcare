'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecentProviders, type RecentProvider } from './ViewTracker';

export default function RecentlyViewed() {
  const [providers, setProviders] = useState<RecentProvider[]>([]);

  useEffect(() => {
    setProviders(getRecentProviders());
  }, []);

  if (providers.length === 0) return null;

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recently Viewed</h2>
          <button
            onClick={() => {
              localStorage.removeItem('hn_recent');
              setProviders([]);
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {providers.map((p) => (
            <Link
              key={p.npi}
              href={`/provider/${p.npi}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-3 text-center transition-all hover:border-brand-200 hover:shadow-sm"
            >
              <img
                src={`https://api.dicebear.com/9.x/micah/svg?seed=${p.npi}`}
                alt={p.name}
                className="h-12 w-12 rounded-full bg-brand-50"
              />
              <div>
                <p className="line-clamp-1 text-xs font-semibold text-gray-800 group-hover:text-brand-700">
                  {p.name}
                </p>
                {p.credentials && <p className="text-xs text-gray-400">{p.credentials}</p>}
                {p.specialty && <p className="line-clamp-1 text-xs text-gray-400">{p.specialty}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
