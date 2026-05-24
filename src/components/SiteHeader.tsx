'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SiteHeader() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
              <path
                fillRule="evenodd"
                d="M11.25 4.5a.75.75 0 0 1 1.5 0v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900">HealthNavigator</span>
        </Link>

        {/* Compact search */}
        <form onSubmit={handleSubmit} className="relative hidden flex-1 sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search providers or cities…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </form>

        <nav className="flex flex-shrink-0 items-center gap-3">
          <Link
            href="/ca"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-brand-600 sm:block"
          >
            Cities
          </Link>
          <Link
            href="/#specialties"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-brand-600 sm:block"
          >
            Specialties
          </Link>
          <Link
            href="/find"
            className="hidden items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-800 sm:flex"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                clipRule="evenodd"
              />
            </svg>
            Find Specialist
          </Link>
          <Link
            href="/bookmarks"
            title="Saved providers"
            className="hidden items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-rose-600 sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
            Saved
          </Link>
          <Link
            href="/ca"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Find a Provider
          </Link>
        </nav>
      </div>
    </header>
  );
}
