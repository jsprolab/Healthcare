import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getCityBySlug } from '@/services/cities';
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildWebPageSchema,
  cityTitle,
  cityDescription,
} from '@/lib/seo';
import SiteHeader from '@/components/SiteHeader';
import Breadcrumb from '@/components/Breadcrumb';

interface Props {
  params: Promise<{ city: string }>;
}

export const revalidate = 86400;
export const dynamicParams = true;

// Full class strings for Tailwind JIT
const SPECIALTY_COLORS = [
  {
    icon: 'bg-blue-500 text-white',
    card: 'border-blue-100 hover:border-blue-300 hover:bg-blue-50',
    count: 'bg-blue-100 text-blue-700',
    arrow: 'group-hover:text-blue-500',
  },
  {
    icon: 'bg-indigo-500 text-white',
    card: 'border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50',
    count: 'bg-indigo-100 text-indigo-700',
    arrow: 'group-hover:text-indigo-500',
  },
  {
    icon: 'bg-violet-500 text-white',
    card: 'border-violet-100 hover:border-violet-300 hover:bg-violet-50',
    count: 'bg-violet-100 text-violet-700',
    arrow: 'group-hover:text-violet-500',
  },
  {
    icon: 'bg-pink-500 text-white',
    card: 'border-pink-100 hover:border-pink-300 hover:bg-pink-50',
    count: 'bg-pink-100 text-pink-700',
    arrow: 'group-hover:text-pink-500',
  },
  {
    icon: 'bg-rose-500 text-white',
    card: 'border-rose-100 hover:border-rose-300 hover:bg-rose-50',
    count: 'bg-rose-100 text-rose-700',
    arrow: 'group-hover:text-rose-500',
  },
  {
    icon: 'bg-orange-500 text-white',
    card: 'border-orange-100 hover:border-orange-300 hover:bg-orange-50',
    count: 'bg-orange-100 text-orange-700',
    arrow: 'group-hover:text-orange-500',
  },
  {
    icon: 'bg-amber-500 text-white',
    card: 'border-amber-100 hover:border-amber-300 hover:bg-amber-50',
    count: 'bg-amber-100 text-amber-700',
    arrow: 'group-hover:text-amber-500',
  },
  {
    icon: 'bg-teal-500 text-white',
    card: 'border-teal-100 hover:border-teal-300 hover:bg-teal-50',
    count: 'bg-teal-100 text-teal-700',
    arrow: 'group-hover:text-teal-500',
  },
  {
    icon: 'bg-cyan-500 text-white',
    card: 'border-cyan-100 hover:border-cyan-300 hover:bg-cyan-50',
    count: 'bg-cyan-100 text-cyan-700',
    arrow: 'group-hover:text-cyan-500',
  },
  {
    icon: 'bg-sky-500 text-white',
    card: 'border-sky-100 hover:border-sky-300 hover:bg-sky-50',
    count: 'bg-sky-100 text-sky-700',
    arrow: 'group-hover:text-sky-500',
  },
  {
    icon: 'bg-emerald-500 text-white',
    card: 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50',
    count: 'bg-emerald-100 text-emerald-700',
    arrow: 'group-hover:text-emerald-500',
  },
  {
    icon: 'bg-green-500 text-white',
    card: 'border-green-100 hover:border-green-300 hover:bg-green-50',
    count: 'bg-green-100 text-green-700',
    arrow: 'group-hover:text-green-500',
  },
  {
    icon: 'bg-lime-500 text-white',
    card: 'border-lime-100 hover:border-lime-300 hover:bg-lime-50',
    count: 'bg-lime-100 text-lime-700',
    arrow: 'group-hover:text-lime-500',
  },
  {
    icon: 'bg-purple-500 text-white',
    card: 'border-purple-100 hover:border-purple-300 hover:bg-purple-50',
    count: 'bg-purple-100 text-purple-700',
    arrow: 'group-hover:text-purple-500',
  },
  {
    icon: 'bg-fuchsia-500 text-white',
    card: 'border-fuchsia-100 hover:border-fuchsia-300 hover:bg-fuchsia-50',
    count: 'bg-fuchsia-100 text-fuchsia-700',
    arrow: 'group-hover:text-fuchsia-500',
  },
  {
    icon: 'bg-slate-500 text-white',
    card: 'border-slate-100 hover:border-slate-300 hover:bg-slate-50',
    count: 'bg-slate-100 text-slate-700',
    arrow: 'group-hover:text-slate-500',
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};
  const title = cityTitle(city);
  const description = cityDescription(city);
  const url = absoluteUrl(`/ca/${citySlug}`);
  return {
    title,
    description,
    alternates: { canonical: `/ca/${citySlug}` },
    openGraph: { title, description, url },
  };
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  // Run the expensive specialty aggregation and stats in parallel, but stats use
  // a single raw query instead of 4 separate count() calls to avoid pool contention.
  type StatsRow = { medicare: bigint; telehealth: bigint; male: bigint; female: bigint };
  const [specialties, [statsRow]] = await Promise.all([
    prisma.specialty
      .findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { providers: { where: { cityId: city.id } } } } },
      })
      .then((rows) =>
        rows
          .map((s) => ({ ...s, providerCount: s._count.providers }))
          .filter((s) => s.providerCount > 0)
          .sort((a, b) => b.providerCount - a.providerCount)
      ),
    prisma.$queryRaw<StatsRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE "acceptsMedicare" = true)  AS medicare,
        COUNT(*) FILTER (WHERE telehealth = true)          AS telehealth,
        COUNT(*) FILTER (WHERE gender = 'M')               AS male,
        COUNT(*) FILTER (WHERE gender = 'F')               AS female
      FROM providers
      WHERE city_id = ${city.id}
    `,
  ]);

  const total = city.providerCount;
  const medicareCount = Number(statsRow?.medicare ?? 0);
  const telehealthCount = Number(statsRow?.telehealth ?? 0);
  const maleCount = Number(statsRow?.male ?? 0);
  const femaleCount = Number(statsRow?.female ?? 0);
  const pctMedicare = total > 0 ? Math.round((medicareCount / total) * 100) : null;
  const pctTelehealth = total > 0 ? Math.round((telehealthCount / total) * 100) : null;
  const pctMale =
    maleCount + femaleCount > 0 ? Math.round((maleCount / (maleCount + femaleCount)) * 100) : null;

  const topSpecialty = specialties[0] ?? null;

  const pageUrl = absoluteUrl(`/ca/${citySlug}`);
  const title = cityTitle(city);

  const jsonLd = buildWebPageSchema({
    name: title,
    description: cityDescription(city),
    url: pageUrl,
    breadcrumbs: [
      { name: SITE_NAME, url: SITE_URL },
      { name: 'California', url: absoluteUrl('/ca') },
      { name: city.name, url: pageUrl },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'California', href: '/ca' },
                { label: city.name },
              ]}
              light
            />
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
                  California
                </p>
                <h1 className="mt-1 text-4xl font-bold text-white sm:text-5xl">{city.name}</h1>
                <p className="mt-3 text-brand-200">Healthcare provider directory</p>
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20">
                  <p className="text-2xl font-bold text-white">
                    {city.providerCount.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-brand-300">Verified Providers</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20">
                  <p className="text-2xl font-bold text-white">{specialties.length}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-300">Specialties</p>
                </div>
                {topSpecialty && (
                  <div className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20">
                    <p className="text-2xl font-bold text-white">
                      {topSpecialty.providerCount.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-brand-300 max-w-[120px] truncate">
                      {topSpecialty.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* City stats bar */}
        {(pctMedicare !== null || pctTelehealth !== null || pctMale !== null) && (
          <div className="border-b border-gray-100 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-6">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {pctMedicare !== null && (
                  <div className="rounded-xl bg-blue-50 px-4 py-3">
                    <dd className="text-2xl font-bold text-blue-700">{pctMedicare}%</dd>
                    <dt className="mt-0.5 text-xs font-medium text-blue-500">Accept Medicare</dt>
                  </div>
                )}
                {pctTelehealth !== null && (
                  <div className="rounded-xl bg-teal-50 px-4 py-3">
                    <dd className="text-2xl font-bold text-teal-700">{pctTelehealth}%</dd>
                    <dt className="mt-0.5 text-xs font-medium text-teal-500">Offer Telehealth</dt>
                  </div>
                )}
                {pctMale !== null && (
                  <>
                    <div className="rounded-xl bg-indigo-50 px-4 py-3">
                      <dd className="text-2xl font-bold text-indigo-700">{pctMale}%</dd>
                      <dt className="mt-0.5 text-xs font-medium text-indigo-500">Male Providers</dt>
                    </div>
                    <div className="rounded-xl bg-pink-50 px-4 py-3">
                      <dd className="text-2xl font-bold text-pink-700">{100 - pctMale}%</dd>
                      <dt className="mt-0.5 text-xs font-medium text-pink-500">Female Providers</dt>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Specialty grid */}
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Browse by Specialty</h2>
              <p className="mt-1 text-sm text-gray-500">
                {specialties.length} specialties available in{' '}
                <span className="font-semibold text-gray-700">{city.name}</span>
              </p>
            </div>
            <Link href="/ca" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              ← All cities
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {specialties.map((specialty, i) => {
              const color = SPECIALTY_COLORS[i % SPECIALTY_COLORS.length];
              return (
                <Link
                  key={specialty.slug}
                  href={`/ca/${citySlug}/${specialty.slug}`}
                  className={`group flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${color.card}`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${color.icon}`}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path
                        fillRule="evenodd"
                        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {specialty.name}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color.count}`}
                      >
                        {specialty.providerCount.toLocaleString()} providers
                      </span>
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-4 w-4 flex-shrink-0 text-gray-300 transition-colors ${color.arrow}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
