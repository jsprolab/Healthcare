import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import { formatPhone } from '@/utils';
import BackButton from '@/components/BackButton';

interface Props {
  searchParams: Promise<{ npis?: string }>;
}

const CHECKS = {
  true: <span className="text-emerald-600">✓</span>,
  false: <span className="text-gray-300">—</span>,
};

export default async function ComparePage({ searchParams }: Props) {
  const { npis: rawNpis } = await searchParams;
  const npis = (rawNpis ?? '')
    .split(',')
    .map((n) => n.trim())
    .filter((n) => /^\d{10}$/.test(n))
    .slice(0, 3);
  if (npis.length < 2) notFound();

  const providers = await prisma.provider.findMany({
    where: { npi: { in: npis } },
    include: { specialty: true, city: true },
  });

  if (providers.length < 2) notFound();

  // Keep order matching URL
  const ordered = npis
    .map((n) => providers.find((p) => p.npi === n))
    .filter(Boolean) as typeof providers;

  const rows: { label: string; render: (p: (typeof providers)[0]) => React.ReactNode }[] = [
    { label: 'Type', render: (p) => (p.organizationName ? 'Organization' : 'Individual') },
    { label: 'Specialty', render: (p) => p.specialty?.name ?? '—' },
    { label: 'City', render: (p) => (p.city ? `${p.city.name}, CA` : '—') },
    { label: 'Address', render: (p) => [p.address1, p.zipCode].filter(Boolean).join(', ') || '—' },
    { label: 'Phone', render: (p) => (p.phone ? formatPhone(p.phone) : '—') },
    {
      label: 'Accepts Medicare',
      render: (p) => CHECKS[String(!!p.acceptsMedicare) as 'true' | 'false'],
    },
    { label: 'Telehealth', render: (p) => CHECKS[String(!!p.telehealth) as 'true' | 'false'] },
    {
      label: 'Gender',
      render: (p) => (p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : '—'),
    },
    { label: 'Credentials', render: (p) => p.credentials ?? '—' },
    { label: 'NPI', render: (p) => <span className="font-mono text-xs">{p.npi}</span> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold text-gray-900">Compare Providers</h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Header row */}
          <div
            className={`grid divide-x divide-gray-100 border-b border-gray-100`}
            style={{ gridTemplateColumns: `200px repeat(${ordered.length}, 1fr)` }}
          >
            <div className="p-4" />
            {ordered.map((p) => {
              const isOrg = !!p.organizationName;
              const name = isOrg
                ? p.organizationName!
                : [p.firstName, p.lastName].filter(Boolean).join(' ');
              return (
                <div key={p.npi} className="flex flex-col items-center gap-3 p-5 text-center">
                  <img
                    src={`https://api.dicebear.com/9.x/micah/svg?seed=${p.npi}`}
                    alt={name}
                    className="h-16 w-16 rounded-full bg-brand-50"
                  />
                  <div>
                    <Link
                      href={`/provider/${p.npi}`}
                      className="text-sm font-bold text-gray-900 hover:text-brand-700"
                    >
                      {name}
                    </Link>
                    {p.credentials && <p className="text-xs text-gray-500">{p.credentials}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data rows */}
          {rows.map(({ label, render }, i) => (
            <div
              key={label}
              className={`grid divide-x divide-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}
              style={{ gridTemplateColumns: `200px repeat(${ordered.length}, 1fr)` }}
            >
              <div className="flex items-center px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {label}
                </span>
              </div>
              {ordered.map((p) => (
                <div
                  key={p.npi}
                  className="flex items-center justify-center px-4 py-3 text-sm text-gray-800"
                >
                  {render(p)}
                </div>
              ))}
            </div>
          ))}

          {/* Action row */}
          <div
            className="grid divide-x divide-gray-100 border-t border-gray-100"
            style={{ gridTemplateColumns: `200px repeat(${ordered.length}, 1fr)` }}
          >
            <div className="p-4" />
            {ordered.map((p) => {
              const name =
                p.organizationName ?? [p.firstName, p.lastName].filter(Boolean).join(' ');
              return (
                <div key={p.npi} className="flex justify-center p-4">
                  <Link
                    href={`/provider/${p.npi}`}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    View {name.split(' ')[0]}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
