'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProviderHit {
  npi: string;
  name: string;
  specialty: string | null;
  city: string | null;
  citySlug: string | null;
  specialtySlug: string | null;
  isOrg: boolean;
  zipCode?: string | null;
  acceptsMedicare?: boolean;
  telehealth?: boolean;
}
interface CityHit {
  slug: string;
  name: string;
  providerCount: number;
}
interface SpecialtyHit {
  slug: string;
  name: string;
}
interface Results {
  providers: ProviderHit[];
  cities: CityHit[];
  specialties: SpecialtyHit[];
  isZipSearch?: boolean;
  zip?: string;
}

const EMPTY: Results = { providers: [], cities: [], specialties: [] };

function hasResults(r: Results) {
  return r.providers.length > 0 || r.cities.length > 0 || r.specialties.length > 0;
}

export default function SearchBar({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const allItems = [
    ...results.providers.map((p) => ({ href: `/provider/${p.npi}` })),
    ...results.cities.map((c) => ({ href: `/ca/${c.slug}` })),
    ...results.specialties.map(() => ({ href: `/#specialties` })),
  ];

  const fetch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await globalThis.fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: Results = await res.json();
      setResults(data);
      setCursor(-1);
    } catch {
      setResults(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetch(q), 300);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, allItems.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, -1));
    }
    if (e.key === 'Enter' && cursor >= 0 && allItems[cursor]) {
      e.preventDefault();
      router.push(allItems[cursor].href);
      setOpen(false);
      setQuery('');
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setCursor(-1);
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const showDropdown = open && query.length >= 2;
  let itemIndex = -1;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          {loading ? (
            <svg className="h-4 w-4 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search providers, cities, or specialties…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          autoComplete="off"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          {!hasResults(results) && !loading && (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {results.providers.length > 0 && (
            <div>
              <p className="border-b border-gray-50 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {results.isZipSearch ? `Providers in ZIP ${results.zip}` : 'Providers'}
              </p>
              {results.providers.map((p) => {
                itemIndex++;
                const idx = itemIndex;
                return (
                  <Link
                    key={p.npi}
                    href={`/provider/${p.npi}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50 ${cursor === idx ? 'bg-brand-50' : ''}`}
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/micah/svg?seed=${p.npi}`}
                      alt={p.name}
                      className="h-8 w-8 flex-shrink-0 rounded-full bg-brand-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {[
                          p.specialty,
                          p.city ? `${p.city}, CA` : null,
                          p.zipCode ? `ZIP ${p.zipCode}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {p.acceptsMedicare && (
                        <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                          M
                        </span>
                      )}
                      {p.telehealth && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                          TH
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isOrg ? 'bg-violet-100 text-violet-700' : 'bg-brand-100 text-brand-700'}`}
                      >
                        {p.isOrg ? 'Org' : 'MD'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {results.cities.length > 0 && (
            <div>
              <p className="border-b border-t border-gray-50 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cities
              </p>
              {results.cities.map((c) => {
                itemIndex++;
                const idx = itemIndex;
                return (
                  <Link
                    key={c.slug}
                    href={`/ca/${c.slug}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50 ${cursor === idx ? 'bg-brand-50' : ''}`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 text-emerald-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.013 3.5-4.667 3.5-8.077 0-4.698-3.806-8.5-8.5-8.5S3.5 7.302 3.5 12c0 3.41 1.556 6.064 3.5 8.077a19.578 19.578 0 0 0 2.683 2.282c.39.276.78.534 1.143.742ZM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{c.name}, CA</p>
                      <p className="text-xs text-gray-500">
                        {c.providerCount.toLocaleString()} providers
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {results.specialties.length > 0 && (
            <div>
              <p className="border-b border-t border-gray-50 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Specialties
              </p>
              {results.specialties.map((s) => {
                itemIndex++;
                const idx = itemIndex;
                return (
                  <Link
                    key={s.slug}
                    href="/#specialties"
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50 ${cursor === idx ? 'bg-brand-50' : ''}`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-sky-600">
                        <path
                          fillRule="evenodd"
                          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">Browse by city →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-50 bg-gray-50 px-4 py-2">
            <p className="text-xs text-gray-400">
              Press ↑↓ to navigate · Enter to select · Esc to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
