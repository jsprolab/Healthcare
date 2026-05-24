import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatPhone } from '@/utils';
import SiteHeader from '@/components/SiteHeader';

const PAGE_SIZE = 20;
const ZIP_RE = /^\d{5}$/;

interface Props {
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : 'Search Providers', robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: rawQ, tab: rawTab, page: rawPage } = await searchParams;
  const q = (rawQ ?? '').trim();
  const tab = rawTab === 'cities' || rawTab === 'specialties' ? rawTab : 'providers';
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  if (q.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-gray-500">Enter at least 2 characters to search.</p>
        </div>
      </div>
    );
  }

  const isZip = ZIP_RE.test(q);
  const words = q.split(/\s+/);
  const multi = words.length >= 2;

  const [providers, providerTotal, cities, cityTotal, specialties] = await Promise.all([
    prisma.provider.findMany({
      where: isZip
        ? { zipCode: { startsWith: q }, city: { state: 'CA' } }
        : {
            OR: multi
              ? [
                  {
                    firstName: { startsWith: words[0], mode: 'insensitive' },
                    lastName: { startsWith: words[words.length - 1], mode: 'insensitive' },
                  },
                  { organizationName: { contains: q, mode: 'insensitive' } },
                ]
              : [
                  { lastName: { startsWith: q, mode: 'insensitive' } },
                  { organizationName: { startsWith: q, mode: 'insensitive' } },
                ],
            city: { state: 'CA' },
          },
      include: { specialty: true, city: true },
      orderBy: isZip ? { lastName: 'asc' } : [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: tab === 'providers' ? skip : 0,
      take: tab === 'providers' ? PAGE_SIZE : 5,
    }),
    prisma.provider.count({
      where: isZip
        ? { zipCode: { startsWith: q }, city: { state: 'CA' } }
        : {
            OR: multi
              ? [
                  {
                    firstName: { startsWith: words[0], mode: 'insensitive' },
                    lastName: { startsWith: words[words.length - 1], mode: 'insensitive' },
                  },
                  { organizationName: { contains: q, mode: 'insensitive' } },
                ]
              : [
                  { lastName: { startsWith: q, mode: 'insensitive' } },
                  { organizationName: { startsWith: q, mode: 'insensitive' } },
                ],
            city: { state: 'CA' },
          },
    }),
    prisma.city.findMany({
      where: { state: 'CA', providerCount: { gt: 0 }, name: { contains: q, mode: 'insensitive' } },
      orderBy: { providerCount: 'desc' },
      skip: tab === 'cities' ? skip : 0,
      take: tab === 'cities' ? PAGE_SIZE : 5,
    }),
    prisma.city.count({
      where: { state: 'CA', providerCount: { gt: 0 }, name: { contains: q, mode: 'insensitive' } },
    }),
    prisma.specialty.findMany({ where: { name: { contains: q, mode: 'insensitive' } } }),
  ]);

  const totalPages =
    tab === 'providers'
      ? Math.ceil(providerTotal / PAGE_SIZE)
      : tab === 'cities'
        ? Math.ceil(cityTotal / PAGE_SIZE)
        : 1;

  function tabHref(t: string) {
    return `/search?q=${encodeURIComponent(q)}&tab=${t}&page=1`;
  }
  function pageHref(p: number) {
    return `/search?q=${encodeURIComponent(q)}&tab=${tab}&page=${p}`;
  }

  const tabs = [
    { key: 'providers', label: 'Providers', count: providerTotal },
    { key: 'cities', label: 'Cities', count: cityTotal },
    { key: 'specialties', label: 'Specialties', count: specialties.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <div className="border-b border-gray-100 bg-white px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-gray-500">Results for</p>
          <h1 className="mt-0.5 text-2xl font-bold text-gray-900">&ldquo;{q}&rdquo;</h1>
          <div className="mt-4 flex gap-1">
            {tabs.map(({ key, label, count }) => (
              <Link
                key={key}
                href={tabHref(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === key ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}{' '}
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${tab === key ? 'bg-white/20' : 'bg-gray-100'}`}
                >
                  {count.toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {tab === 'providers' && (
          <div className="space-y-3">
            {providers.length === 0 ? (
              <EmptyState q={q} />
            ) : (
              <>
                {providers.map((p) => {
                  const isOrg = !!p.organizationName;
                  const name = isOrg
                    ? p.organizationName!
                    : [p.firstName, p.lastName].filter(Boolean).join(' ');
                  return (
                    <Link
                      key={p.npi}
                      href={`/provider/${p.npi}`}
                      className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
                    >
                      <img
                        src={`https://api.dicebear.com/9.x/micah/svg?seed=${p.npi}`}
                        alt={name}
                        className="h-12 w-12 flex-shrink-0 rounded-full bg-brand-50"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 group-hover:text-brand-700">
                            {name}
                          </span>
                          {p.credentials && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {p.credentials}
                            </span>
                          )}
                          {p.acceptsMedicare && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                              Medicare
                            </span>
                          )}
                          {p.telehealth && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                              Telehealth
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {[
                            p.specialty?.name,
                            p.city ? `${p.city.name}, CA` : null,
                            p.phone ? formatPhone(p.phone) : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5 flex-shrink-0 text-gray-300 group-hover:text-brand-400"
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
                <Pagination page={page} totalPages={totalPages} pageHref={pageHref} />
              </>
            )}
          </div>
        )}

        {tab === 'cities' && (
          <div className="space-y-3">
            {cities.length === 0 ? (
              <EmptyState q={q} />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {cities.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/ca/${c.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:border-brand-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-brand-700">
                          {c.name}, CA
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.providerCount.toLocaleString()} providers
                        </p>
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
                  ))}
                </div>
                <Pagination page={page} totalPages={totalPages} pageHref={pageHref} />
              </>
            )}
          </div>
        )}

        {tab === 'specialties' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {specialties.length === 0 ? (
              <EmptyState q={q} />
            ) : (
              specialties.map((s) => (
                <Link
                  key={s.slug}
                  href={`/#specialties`}
                  className="group rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:border-brand-200"
                >
                  <p className="font-semibold text-gray-900 group-hover:text-brand-700">{s.name}</p>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{s.description}</p>
                  )}
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ q }: { q: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-8 py-14 text-center">
      <p className="text-gray-500">No results for &ldquo;{q}&rdquo;</p>
      <Link
        href="/ca"
        className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
      >
        Browse all providers →
      </Link>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  pageHref,
}: {
  page: number;
  totalPages: number;
  pageHref: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={pageHref(page - 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Prev
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={pageHref(page + 1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
