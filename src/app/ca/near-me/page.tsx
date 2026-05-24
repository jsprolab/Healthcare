import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatPhone } from '@/utils';
import SiteHeader from '@/components/SiteHeader';

const RADII = [5, 10, 25, 50] as const;
type Radius = (typeof RADII)[number];
const DEFAULT_RADIUS: Radius = 10;
const PAGE_SIZE = 25;

interface Props {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    radius?: string;
    specialty?: string;
    medicare?: string;
    telehealth?: string;
    gender?: string;
    page?: string;
  }>;
}

interface ProviderRow {
  id: string;
  npi: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  phone: string | null;
  address1: string | null;
  zip_code: string | null;
  accepts_medicare: boolean | null;
  telehealth: boolean | null;
  gender: string | null;
  credentials: string | null;
  distance_miles: number;
  specialty_name: string | null;
  specialty_slug: string | null;
  city_name: string | null;
  city_slug: string | null;
}

export default async function NearMePage({ searchParams }: Props) {
  const sp = await searchParams;
  const lat = parseFloat(sp.lat ?? '');
  const lng = parseFloat(sp.lng ?? '');
  const valid = !isNaN(lat) && !isNaN(lng) && lat >= 32 && lat <= 42 && lng >= -125 && lng <= -114;

  const radiusNum = parseInt(sp.radius ?? '', 10);
  const radius: Radius = (
    RADII.includes(radiusNum as Radius) ? radiusNum : DEFAULT_RADIUS
  ) as Radius;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const medicareOnly = sp.medicare === '1';
  const telehealthOnly = sp.telehealth === '1';
  const genderFilter = sp.gender === 'M' || sp.gender === 'F' ? sp.gender : null;

  // Optional specialty filter
  const specialtySlug = sp.specialty ?? null;
  const specialty = specialtySlug
    ? await prisma.specialty.findUnique({ where: { slug: specialtySlug } })
    : null;

  let providers: ProviderRow[] = [];
  let total = 0;

  if (valid) {
    const medicareClause = medicareOnly ? Prisma.sql`AND p.accepts_medicare = true` : Prisma.empty;
    const telehealthClause = telehealthOnly ? Prisma.sql`AND p.telehealth = true` : Prisma.empty;
    const genderClause = genderFilter ? Prisma.sql`AND p.gender = ${genderFilter}` : Prisma.empty;
    const specialtyClause = specialty
      ? Prisma.sql`AND p.specialty_id = ${specialty.id}`
      : Prisma.empty;

    const distanceExpr = Prisma.sql`
      (3959 * acos(
        GREATEST(-1, LEAST(1,
          cos(radians(${lat})) * cos(radians(p.latitude::float)) *
          cos(radians(p.longitude::float) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(p.latitude::float))
        ))
      ))
    `;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<ProviderRow[]>`
        SELECT p.id, p.npi, p.first_name, p.last_name, p.organization_name,
               p.phone, p.address1, p.zip_code,
               p.accepts_medicare, p.telehealth, p.gender, p.credentials,
               sp.name AS specialty_name, sp.slug AS specialty_slug,
               c.name AS city_name, c.slug AS city_slug,
               ${distanceExpr} AS distance_miles
        FROM providers p
        LEFT JOIN specialties sp ON p.specialty_id = sp.id
        LEFT JOIN cities c ON p.city_id = c.id
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
          AND p.state = 'CA'
          ${medicareClause}
          ${telehealthClause}
          ${genderClause}
          ${specialtyClause}
          AND ${distanceExpr} <= ${radius}
        ORDER BY distance_miles
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM providers p
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
          AND p.state = 'CA'
          ${medicareClause}
          ${telehealthClause}
          ${genderClause}
          ${specialtyClause}
          AND ${distanceExpr} <= ${radius}
      `,
    ]);

    providers = rows;
    total = Number(countRows[0]?.count ?? 0);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function filterHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (sp.lat) p.set('lat', sp.lat);
    if (sp.lng) p.set('lng', sp.lng);
    p.set('radius', String(radius));
    if (specialtySlug) p.set('specialty', specialtySlug);
    if (medicareOnly) p.set('medicare', '1');
    if (telehealthOnly) p.set('telehealth', '1');
    if (genderFilter) p.set('gender', genderFilter);
    p.set('page', '1');
    Object.entries(overrides).forEach(([k, v]) => (v === undefined ? p.delete(k) : p.set(k, v)));
    if (!p.has('page')) p.set('page', '1');
    return `/ca/near-me?${p.toString()}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pb-16 pt-10">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <Link href="/" className="text-xs text-brand-300 hover:text-white">
            ← Home
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Providers Near You</h1>
          <p className="mt-2 text-brand-200">
            {valid
              ? `Showing providers within ${radius} miles of your location`
              : 'Enable location to find providers near you'}
          </p>
          {valid && total > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/20">
              <span className="text-xl font-bold text-white">{total.toLocaleString()}</span>
              <span className="text-sm text-brand-200">providers found</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {!valid ? (
          <NearMePrompt />
        ) : (
          <div className="space-y-4">
            {/* Filters toolbar */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              {/* Radius */}
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {RADII.map((r) => (
                  <Link
                    key={r}
                    href={filterHref({ radius: String(r) })}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      radius === r ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {r}mi
                  </Link>
                ))}
              </div>

              <div className="h-4 w-px bg-gray-200" />

              {/* Gender */}
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {(
                  [
                    ['Any', null],
                    ['Male', 'M'],
                    ['Female', 'F'],
                  ] as [string, string | null][]
                ).map(([label, val]) => (
                  <Link
                    key={label}
                    href={filterHref({ gender: val ?? undefined })}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      genderFilter === val
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="h-4 w-px bg-gray-200" />

              {/* Medicare */}
              <Link
                href={filterHref({ medicare: medicareOnly ? undefined : '1' })}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  medicareOnly
                    ? 'border-blue-300 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700'
                }`}
              >
                Accepts Medicare
              </Link>

              {/* Telehealth */}
              <Link
                href={filterHref({ telehealth: telehealthOnly ? undefined : '1' })}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  telehealthOnly
                    ? 'border-emerald-300 bg-emerald-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
                }`}
              >
                Telehealth
              </Link>

              {total > 0 && (
                <span className="ml-auto text-xs text-gray-400">
                  {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
                </span>
              )}
            </div>

            {/* Provider list */}
            {providers.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white px-8 py-14 text-center">
                <p className="text-gray-500">
                  No providers found within {radius} miles with these filters.
                </p>
                <Link
                  href={filterHref({
                    radius: '50',
                    medicare: undefined,
                    telehealth: undefined,
                    gender: undefined,
                  })}
                  className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
                >
                  Expand to 50 miles and clear filters
                </Link>
              </div>
            ) : (
              <>
                {providers.map((p) => {
                  const isOrg = !!p.organization_name;
                  const name = isOrg
                    ? p.organization_name!
                    : [p.first_name, p.last_name].filter(Boolean).join(' ');
                  const distLabel =
                    p.distance_miles < 1
                      ? `${(p.distance_miles * 5280).toFixed(0)} ft`
                      : `${p.distance_miles.toFixed(1)} mi`;

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
                          <span className="font-semibold text-gray-900 transition-colors group-hover:text-brand-700">
                            {name}
                          </span>
                          {p.credentials && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {p.credentials}
                            </span>
                          )}
                          {p.accepts_medicare && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Medicare
                            </span>
                          )}
                          {p.telehealth && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Telehealth
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          {p.specialty_name && <span>{p.specialty_name}</span>}
                          {p.city_name && <span>📍 {p.city_name}, CA</span>}
                          {p.phone && <span>{formatPhone(p.phone)}</span>}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          {distLabel}
                        </span>
                      </div>
                    </Link>
                  );
                })}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      {page > 1 && (
                        <Link
                          href={filterHref({ page: String(page - 1) })}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          ← Prev
                        </Link>
                      )}
                      {page < totalPages && (
                        <Link
                          href={filterHref({ page: String(page + 1) })}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Next →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NearMePrompt() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-8 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-brand-600">
          <path
            fillRule="evenodd"
            d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.013 3.5-4.667 3.5-8.077 0-4.698-3.806-8.5-8.5-8.5S3.5 7.302 3.5 12c0 3.41 1.556 6.064 3.5 8.077a19.578 19.578 0 0 0 2.683 2.282c.39.276.78.534 1.143.742ZM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-900">Location required</h2>
      <p className="mt-1 text-sm text-gray-500">
        Use the Near Me button on the home page to find providers near your location.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Go to Home
      </Link>
    </div>
  );
}
