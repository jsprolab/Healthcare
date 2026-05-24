import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getCityBySlug } from '@/services/cities';
import { getSpecialtyBySlug } from '@/services/specialties';
import { formatPhone } from '@/utils';
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildWebPageSchema,
  citySpecialtyTitle,
  citySpecialtyDescription,
} from '@/lib/seo';
import { getCaSpecialtyParams } from '@/lib/static-params';
import SiteHeader from '@/components/SiteHeader';
import Breadcrumb from '@/components/Breadcrumb';
import PerPageSelector from '@/components/PerPageSelector';
import CompareCheckbox from '@/components/CompareCheckbox';
import CompareBar from '@/components/CompareBar';

const VALID_PAGE_SIZES = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

interface Props {
  params: Promise<{ city: string; specialty: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    type?: string;
    medicare?: string;
    telehealth?: string;
    gender?: string;
  }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  return getCaSpecialtyParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, specialty: specialtySlug } = await params;
  const [city, specialty] = await Promise.all([
    getCityBySlug(citySlug),
    getSpecialtyBySlug(specialtySlug),
  ]);
  if (!city || !specialty) return {};
  const title = citySpecialtyTitle(city, specialty);
  const description = citySpecialtyDescription(city, specialty);
  const url = absoluteUrl(`/ca/${citySlug}/${specialtySlug}`);
  return {
    title,
    description,
    alternates: { canonical: `/ca/${citySlug}/${specialtySlug}` },
    openGraph: { title, description, url },
  };
}

export default async function CitySpecialtyPage({ params, searchParams }: Props) {
  const { city: citySlug, specialty: specialtySlug } = await params;
  const {
    page: pageParam,
    pageSize: pageSizeParam,
    type: typeParam,
    medicare: medicareParam,
    telehealth: telehealthParam,
    gender: genderParam,
  } = await searchParams;

  const showAll = pageSizeParam === 'all';
  const pageSizeNum = parseInt(pageSizeParam ?? '', 10);
  const pageSize = VALID_PAGE_SIZES.includes(pageSizeNum as (typeof VALID_PAGE_SIZES)[number])
    ? pageSizeNum
    : DEFAULT_PAGE_SIZE;

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const skip = showAll ? 0 : (page - 1) * pageSize;

  const typeFilter =
    typeParam === 'individual'
      ? { organizationName: null }
      : typeParam === 'organization'
        ? { organizationName: { not: null } }
        : {};

  const medicareFilter = medicareParam === '1' ? { acceptsMedicare: true } : {};
  const telehealthFilter = telehealthParam === '1' ? { telehealth: true } : {};
  const genderFilter = genderParam === 'M' || genderParam === 'F' ? { gender: genderParam } : {};

  const [city, specialty] = await Promise.all([
    getCityBySlug(citySlug),
    getSpecialtyBySlug(specialtySlug),
  ]);
  if (!city || !specialty) notFound();

  const where = {
    cityId: city.id,
    specialtyId: specialty.id,
    ...typeFilter,
    ...medicareFilter,
    ...telehealthFilter,
    ...genderFilter,
  };

  const [providers, total] = await prisma.$transaction([
    prisma.provider.findMany({
      where,
      include: { specialty: true, city: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      ...(showAll ? {} : { take: pageSize }),
    }),
    prisma.provider.count({ where }),
  ]);

  const totalPages = showAll ? 1 : Math.ceil(total / pageSize);
  const basePath = `/ca/${citySlug}/${specialtySlug}`;
  const currentPageSizeParam = showAll ? 'all' : String(pageSize);
  const medicareOn = medicareParam === '1';
  const telehealthOn = telehealthParam === '1';
  const genderOn = genderParam === 'M' || genderParam === 'F' ? genderParam : null;

  function filterHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    p.set('pageSize', currentPageSizeParam);
    if (typeParam && typeParam !== 'all') p.set('type', typeParam);
    if (medicareOn) p.set('medicare', '1');
    if (telehealthOn) p.set('telehealth', '1');
    if (genderOn) p.set('gender', genderOn);
    Object.entries(overrides).forEach(([k, v]) => (v === undefined ? p.delete(k) : p.set(k, v)));
    if (!p.has('page')) p.set('page', '1');
    return `${basePath}?${p.toString()}`;
  }

  // Smart empty state — find other CA cities with this specialty
  const suggestedCities =
    total === 0
      ? await prisma.provider
          .groupBy({
            by: ['cityId'],
            where: { specialtyId: specialty.id, cityId: { not: null }, city: { state: 'CA' } },
            _count: { _all: true },
            orderBy: { _count: { cityId: 'desc' } },
            take: 6,
          })
          .then(async (groups) => {
            const ids = groups.map((g) => g.cityId).filter(Boolean) as string[];
            const cities = await prisma.city.findMany({ where: { id: { in: ids } } });
            return groups.map((g) => cities.find((c) => c.id === g.cityId)).filter(Boolean);
          })
      : [];

  const pageUrl = absoluteUrl(`/ca/${citySlug}/${specialtySlug}`);
  const title = citySpecialtyTitle(city, specialty);

  const jsonLd = buildWebPageSchema({
    name: title,
    description: citySpecialtyDescription(city, specialty),
    url: pageUrl,
    breadcrumbs: [
      { name: SITE_NAME, url: SITE_URL },
      { name: 'California', url: absoluteUrl('/ca') },
      { name: city.name, url: absoluteUrl(`/ca/${citySlug}`) },
      { name: specialty.name, url: pageUrl },
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
                { label: city.name, href: `/ca/${citySlug}` },
                { label: specialty.name },
              ]}
              light
            />
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
                  {city.name}, California
                </p>
                <h1 className="mt-1 text-4xl font-bold text-white sm:text-5xl">{specialty.name}</h1>
                {specialty.description ? (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-200">
                    {specialty.description}
                  </p>
                ) : (
                  <p className="mt-3 text-brand-200">Providers in {city.name}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20">
                  <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-300">Providers Found</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-10">
          {providers.length === 0 ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white px-8 py-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-8 w-8 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  No {specialty.name} providers in {city.name}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                  {typeParam ? 'Try removing the provider type filter, or browse' : 'Try browsing'}{' '}
                  another city below.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  {typeParam && (
                    <Link
                      href={`/ca/${citySlug}/${specialtySlug}`}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Clear filter
                    </Link>
                  )}
                  <Link
                    href={`/ca/${citySlug}`}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Other specialties in {city.name}
                  </Link>
                </div>
              </div>

              {suggestedCities.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    {specialty.name} providers in nearby California cities
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestedCities.map(
                      (c) =>
                        c && (
                          <Link
                            key={c.id}
                            href={`/ca/${c.slug}/${specialtySlug}`}
                            className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700">
                                {c.name}
                              </p>
                              <p className="text-xs text-gray-400">California</p>
                            </div>
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-4 w-4 text-gray-300 group-hover:text-brand-400"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Link>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {showAll
                      ? `All ${total.toLocaleString()} providers`
                      : `${skip + 1}–${Math.min(skip + pageSize, total).toLocaleString()} of ${total.toLocaleString()}`}
                  </p>
                  {/* Type filter pills */}
                  <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
                    {(['all', 'individual', 'organization'] as const).map((t) => {
                      const active = (typeParam ?? 'all') === t;
                      const href = filterHref({ type: t === 'all' ? undefined : t });
                      return (
                        <Link
                          key={t}
                          href={href}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors capitalize ${active ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                          {t}
                        </Link>
                      );
                    })}
                  </div>
                  {/* Gender filter */}
                  <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
                    {(
                      [
                        ['Any', null],
                        ['Male', 'M'],
                        ['Female', 'F'],
                      ] as [string, string | null][]
                    ).map(([label, val]) => {
                      const active = genderOn === val;
                      return (
                        <Link
                          key={label}
                          href={filterHref({ gender: val ?? undefined })}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${active ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Medicare filter */}
                  <Link
                    href={filterHref({ medicare: medicareOn ? undefined : '1' })}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                      medicareOn
                        ? 'border-blue-300 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700'
                    }`}
                  >
                    Accepts Medicare
                  </Link>

                  {/* Telehealth filter */}
                  <Link
                    href={filterHref({ telehealth: telehealthOn ? undefined : '1' })}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                      telehealthOn
                        ? 'border-emerald-300 bg-emerald-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
                    }`}
                  >
                    Telehealth
                  </Link>
                </div>
                <PerPageSelector
                  current={currentPageSizeParam}
                  preserveParams={{
                    type: typeParam !== 'all' ? typeParam : undefined,
                    medicare: medicareOn ? '1' : undefined,
                    telehealth: telehealthOn ? '1' : undefined,
                    gender: genderOn ?? undefined,
                  }}
                />
              </div>

              {/* Provider cards */}
              {providers.map((provider) => {
                const isOrg = !!provider.organizationName;
                const displayName = isOrg
                  ? provider.organizationName!
                  : [provider.firstName, provider.lastName].filter(Boolean).join(' ');
                const shortAddress = [
                  provider.city?.name,
                  provider.state,
                  provider.zipCode?.slice(0, 5),
                ]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div key={provider.id} className="relative">
                    <CompareCheckbox
                      item={{
                        npi: provider.npi,
                        name: displayName,
                        specialty: provider.specialty?.name ?? null,
                        city: provider.city?.name ?? null,
                        credentials: provider.credentials ?? null,
                        acceptsMedicare: provider.acceptsMedicare ?? false,
                        telehealth: provider.telehealth ?? false,
                        gender: provider.gender ?? null,
                      }}
                    />
                    <Link
                      href={`/provider/${provider.npi}`}
                      className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
                    >
                      <img
                        src={`https://api.dicebear.com/9.x/micah/svg?seed=${provider.npi}`}
                        alt={displayName}
                        className="h-12 w-12 flex-shrink-0 rounded-full bg-brand-50"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 transition-colors group-hover:text-brand-700">
                            {displayName}
                          </span>
                          {provider.credentials && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {provider.credentials}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${isOrg ? 'bg-violet-100 text-violet-700' : 'bg-brand-50 text-brand-700'}`}
                          >
                            {isOrg ? 'Organization' : 'Individual'}
                          </span>
                          {provider.acceptsMedicare && (
                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              <svg viewBox="0 0 12 12" fill="currentColor" className="h-2.5 w-2.5">
                                <path
                                  fillRule="evenodd"
                                  d="M10.53 3.47a.75.75 0 0 0-1.06 0L5 7.94 2.53 5.47a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l5-5a.75.75 0 0 0 0-1.06Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Medicare
                            </span>
                          )}
                          {provider.telehealth && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <svg viewBox="0 0 12 12" fill="currentColor" className="h-2.5 w-2.5">
                                <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v3A1.5 1.5 0 0 0 1.5 9h6A1.5 1.5 0 0 0 9 7.5V7l2.386 1.193A.5.5 0 0 0 12 7.75v-3.5a.5.5 0 0 0-.614-.457L9 5V4.5A1.5 1.5 0 0 0 7.5 3h-6Z" />
                              </svg>
                              Telehealth
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-500">
                          {shortAddress && (
                            <span className="flex items-center gap-1">
                              <svg
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="h-3 w-3 flex-shrink-0 text-gray-400"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.752 1.25a4.75 4.75 0 0 0-4.75 4.75c0 2.263 1.144 3.997 2.393 5.252A17.88 17.88 0 0 0 7.5 13.01a.75.75 0 0 0 .5 0 17.88 17.88 0 0 0 2.105-1.758C11.354 10 12.5 8.263 12.5 6a4.75 4.75 0 0 0-4.748-4.75ZM8 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {shortAddress}
                            </span>
                          )}
                          {provider.phone && (
                            <span className="flex items-center gap-1">
                              <svg
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="h-3 w-3 flex-shrink-0 text-gray-400"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M1 2.838A1.838 1.838 0 0 1 2.838 1H4.13a1.838 1.838 0 0 1 1.786 1.413l.476 1.901a1.838 1.838 0 0 1-.613 1.849l-.486.393a5.251 5.251 0 0 0 3.365 3.365l.393-.486a1.838 1.838 0 0 1 1.85-.613l1.9.476A1.838 1.838 0 0 1 14 10.87v1.292A1.838 1.838 0 0 1 12.162 14C6.005 14 1 8.995 1 2.838Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {formatPhone(provider.phone)}
                            </span>
                          )}
                          <span className="font-mono text-xs text-gray-400">
                            NPI {provider.npi}
                          </span>
                        </div>
                      </div>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors group-hover:text-brand-400"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </div>
                );
              })}

              {/* Pagination */}
              {!showAll && totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    {page > 1 ? (
                      <Link
                        href={filterHref({ page: String(page - 1) })}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        ← Previous
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed rounded-lg border border-gray-100 px-4 py-2 text-sm font-medium text-gray-300">
                        ← Previous
                      </span>
                    )}
                    {page < totalPages ? (
                      <Link
                        href={filterHref({ page: String(page + 1) })}
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
          )}
        </div>
      </div>
      <CompareBar />
    </>
  );
}
