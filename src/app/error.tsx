'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-32 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-rose-500">
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">
          We hit an unexpected error. You can try again or go back to the homepage.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
