import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = { title: '404 – Page Not Found' };

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-32 text-center">
        <p className="text-6xl font-bold text-brand-200">404</p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Go home
          </Link>
          <Link
            href="/ca"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Browse California
          </Link>
        </div>
      </div>
    </div>
  );
}
