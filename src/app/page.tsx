import Link from 'next/link';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, buildWebSiteSchema } from '@/lib/seo';
import { getAllSpecialties } from '@/services/specialties';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SpecialtyGrid from '@/components/SpecialtyGrid';
import SearchBar from '@/components/SearchBar';
import NearMeButton from '@/components/NearMeButton';
import RecentlyViewed from '@/components/RecentlyViewed';

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} – Find California Healthcare Providers` },
  description:
    'Search verified healthcare providers across California. Filter by city, specialty, and more.',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} – Find California Healthcare Providers`,
    description: 'Search verified healthcare providers across California.',
    url: SITE_URL,
    type: 'website',
  },
};

export default async function HomePage() {
  const [specialties, topCities, providerCount, cityCount] = await Promise.all([
    getAllSpecialties(),
    // Top 30 CA cities by provider count — used in the specialty city-picker and city grid
    prisma.city.findMany({
      where: { state: 'CA', providerCount: { gt: 0 } },
      orderBy: { providerCount: 'desc' },
      take: 30,
      select: { slug: true, name: true, providerCount: true },
    }),
    prisma.provider.count(),
    prisma.city.count({ where: { state: 'CA', providerCount: { gt: 0 } } }),
  ]);

  const jsonLd = buildWebSiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        {/* Hero */}
        <section className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pb-24 pt-20">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-brand-200 ring-1 ring-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              California&apos;s NPI Provider Directory
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find the Right
              <br />
              Healthcare Provider
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-200">
              Search{' '}
              <span className="font-semibold text-white">{providerCount.toLocaleString()}</span>{' '}
              NPI-registered California providers — individuals &amp; organizations — across{' '}
              <span className="font-semibold text-white">{cityCount.toLocaleString()}</span> cities
              and <span className="font-semibold text-white">{specialties.length}</span>{' '}
              specialties.
            </p>
            <p className="mt-2 text-xs text-brand-300">
              Data sourced from CMS NPPES · Call provider to confirm availability
            </p>
            {/* Search + Near Me */}
            <div className="mx-auto mt-8 max-w-2xl">
              <SearchBar />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <NearMeButton />
                <a
                  href="#specialties"
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/20"
                >
                  Browse by Specialty ↓
                </a>
                <Link
                  href="/find"
                  className="flex items-center gap-2 rounded-2xl bg-brand-500/80 px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-brand-400/40 transition-colors hover:bg-brand-500"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Find My Specialist
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar — each stat is a link */}
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <dl className="grid grid-cols-3 divide-x divide-gray-100">
              <Link
                href="/ca"
                className="group px-8 text-center first:pl-0 transition-colors hover:bg-brand-50/50"
              >
                <dd className="text-3xl font-bold text-gray-900 transition-colors group-hover:text-brand-700">
                  {providerCount.toLocaleString()}
                </dd>
                <dt className="mt-1 text-sm text-gray-500 group-hover:text-brand-600">
                  Verified Providers →
                </dt>
              </Link>
              <Link
                href="/ca"
                className="group px-8 text-center transition-colors hover:bg-brand-50/50"
              >
                <dd className="text-3xl font-bold text-gray-900 transition-colors group-hover:text-brand-700">
                  {cityCount.toLocaleString()}
                </dd>
                <dt className="mt-1 text-sm text-gray-500 group-hover:text-brand-600">
                  California Cities →
                </dt>
              </Link>
              <a
                href="#specialties"
                className="group px-8 text-center last:pr-0 transition-colors hover:bg-brand-50/50"
              >
                <dd className="text-3xl font-bold text-gray-900 transition-colors group-hover:text-brand-700">
                  {specialties.length}
                </dd>
                <dt className="mt-1 text-sm text-gray-500 group-hover:text-brand-600">
                  Medical Specialties →
                </dt>
              </a>
            </dl>
          </div>
        </section>

        {/* Specialties — interactive client component */}
        <section id="specialties" className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Browse by Specialty</h2>
              <p className="mt-1 text-sm text-gray-500">
                Click a specialty, then pick a city to see matching providers
              </p>
            </div>
            <SpecialtyGrid specialties={specialties} cities={topCities} />
          </div>
        </section>

        <RecentlyViewed />

        {/* Top cities */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Browse by City</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Top {topCities.length} cities by provider count
                </p>
              </div>
              <Link
                href="/ca"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all {cityCount.toLocaleString()} cities →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/ca/${city.slug}`}
                  className="group flex flex-col rounded-xl border border-gray-100 px-4 py-3 transition-all hover:border-brand-200 hover:bg-brand-50 hover:shadow-sm"
                >
                  <span className="text-sm font-semibold text-gray-800 transition-colors group-hover:text-brand-700">
                    {city.name}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-400">
                    {city.providerCount.toLocaleString()} providers
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Site footer */}
        <footer className="mt-auto border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-white">
                    <path
                      fillRule="evenodd"
                      d="M11.25 4.5a.75.75 0 0 1 1.5 0v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-700">{SITE_NAME}</span>
              </div>
              <p className="text-sm text-gray-500">
                California&apos;s NPI provider directory — individuals &amp; organizations.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
                <span>Data: CMS NPPES Registry</span>
                <span aria-hidden="true">·</span>
                <span>957,438 individual providers</span>
                <span aria-hidden="true">·</span>
                <span>193,003 organizations</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
