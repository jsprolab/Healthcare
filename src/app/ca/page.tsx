import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, absoluteUrl, buildWebPageSchema } from '@/lib/seo';
import { getCitiesPaginated } from '@/services/cities';
import SiteHeader from '@/components/SiteHeader';
import Breadcrumb from '@/components/Breadcrumb';
import CitySearchInput from '@/components/CitySearchInput';

const PAGE_SIZE = 24;

const TITLE = 'California Healthcare Providers';
const DESCRIPTION =
  'Browse verified healthcare providers across California cities. Search by specialty and view contact information.';
const PAGE_URL = absoluteUrl('/ca');

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/ca' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL },
};

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CaliforniaPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const search = q?.trim() || undefined;

  const { cities, total, totalProviders } = await getCitiesPaginated({
    state: 'CA',
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const skip = (page - 1) * PAGE_SIZE;

  const webPageJsonLd = buildWebPageSchema({
    name: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    breadcrumbs: [
      { name: SITE_NAME, url: SITE_URL },
      { name: 'California', url: PAGE_URL },
    ],
  });

  const cityListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Healthcare Provider Cities in California',
    itemListElement: cities.map((city, index) => ({
      '@type': 'ListItem',
      position: skip + index + 1,
      name: `${city.name}, CA`,
      url: absoluteUrl(`/ca/${city.slug}`),
    })),
  };

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    params.set('page', String(p));
    return `/ca?${params.toString()}`;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cityListJsonLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />

        {/* Hero header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pb-16 pt-10">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'California' }]} light />
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
                  United States
                </p>
                <h1 className="mt-1 text-4xl font-bold text-white sm:text-5xl">California</h1>
                <p className="mt-3 text-brand-200">Healthcare provider directory</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20">
                  <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-300">Cities</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20">
                  <p className="text-2xl font-bold text-white">{totalProviders.toLocaleString()}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-300">Verified Providers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              {total === 0
                ? 'No cities found'
                : `Showing ${skip + 1}–${Math.min(skip + PAGE_SIZE, total)} of ${total.toLocaleString()} cities`}
            </p>
            <CitySearchInput defaultValue={search ?? ''} total={total} />
          </div>

          {/* City grid */}
          {cities.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-8 py-16 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900">No cities found</p>
              <p className="mt-2 text-sm text-gray-500">
                No California cities match &ldquo;{search}&rdquo;. Try a different name.
              </p>
              <Link
                href="/ca"
                className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Clear search
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/ca/${city.slug}`}
                  className="group flex items-start justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
                >
                  <div>
                    <div className="font-semibold text-gray-900 transition-colors group-hover:text-brand-700">
                      {city.name}
                    </div>
                    <div className="mt-0.5 text-sm text-gray-400">California</div>
                    <div className="mt-3">
                      {city.providerCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                          {city.providerCount.toLocaleString()} providers
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          Browse specialties
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="mt-0.5 text-xl text-gray-200 transition-colors group-hover:text-brand-400">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-lg border border-gray-100 px-4 py-2 text-sm font-medium text-gray-300">
                    ← Previous
                  </span>
                )}

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 7) {
                      p = i + 1;
                    } else if (page <= 4) {
                      p = i + 1;
                    } else if (page >= totalPages - 3) {
                      p = totalPages - 6 + i;
                    } else {
                      p = page - 3 + i;
                    }
                    return (
                      <Link
                        key={p}
                        href={pageHref(p)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? 'bg-brand-600 text-white'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-lg border border-gray-100 px-4 py-2 text-sm font-medium text-gray-300">
                    Next →
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
