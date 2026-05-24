import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatPhone } from '@/utils';
import {
  absoluteUrl,
  buildProviderSchema,
  buildBreadcrumbSchema,
  providerTitle,
  providerDescription,
} from '@/lib/seo';
import { fetchNpiRegistry, formatPostalCode, sexLabel } from '@/lib/npi-registry';
import type { ProviderWithRelations } from '@/lib/dtos/provider.dto';
import SiteHeader from '@/components/SiteHeader';
import Breadcrumb from '@/components/Breadcrumb';
import ProviderAvatar from '@/components/ProviderAvatar';
import type { BreadcrumbItem } from '@/components/Breadcrumb';
import ShareButton from '@/components/ShareButton';
import BookmarkButton from '@/components/BookmarkButton';
import ViewTracker from '@/components/ViewTracker';
import ReportButton from '@/components/ReportButton';
import ClaimButton from '@/components/ClaimButton';

interface Props {
  params: Promise<{ npi: string }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

async function getProvider(npi: string): Promise<ProviderWithRelations | null> {
  return prisma.provider.findUnique({ where: { npi }, include: { specialty: true, city: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { npi } = await params;
  const provider = await getProvider(npi);
  if (!provider) return {};
  const title = providerTitle(provider);
  const description = providerDescription(provider);
  const url = absoluteUrl(`/provider/${npi}`);
  return {
    title,
    description,
    alternates: { canonical: `/provider/${npi}` },
    openGraph: { title, description, url, type: 'profile' },
  };
}

function DetailRow({
  iconBg,
  icon,
  label,
  value,
}: {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <div className="mt-0.5 text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
}

export default async function ProviderPage({ params }: Props) {
  const { npi } = await params;

  const [provider, npiData] = await Promise.all([getProvider(npi), fetchNpiRegistry(npi)]);
  if (!provider) notFound();

  const isOrg = !!provider.organizationName;
  const displayName = isOrg
    ? provider.organizationName!
    : [provider.firstName, provider.lastName].filter(Boolean).join(' ');

  const credential = npiData?.basic?.credential;
  const fullTitle = credential ? `${displayName}, ${credential}` : displayName;

  const address = [
    provider.address1,
    provider.address2,
    provider.city?.name,
    provider.state,
    provider.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  const mapsQuery = encodeURIComponent(address);
  const hasCoords = provider.latitude != null && provider.longitude != null;
  const lat = hasCoords ? Number(provider.latitude) : null;
  const lng = hasCoords ? Number(provider.longitude) : null;

  const locationAddress = npiData?.addresses?.find((a) => a.address_purpose === 'LOCATION');
  const mailingAddress = npiData?.addresses?.find((a) => a.address_purpose === 'MAILING');
  const fax = locationAddress?.fax_number ?? mailingAddress?.fax_number;
  const primaryTaxonomy = npiData?.taxonomies?.find((t) => t.primary) ?? npiData?.taxonomies?.[0];
  const allTaxonomies = npiData?.taxonomies ?? [];
  const practiceLocations = npiData?.practiceLocations ?? [];

  const relatedProviders =
    provider.city && provider.specialty
      ? await prisma.provider.findMany({
          where: {
            cityId: provider.city.id,
            specialtyId: provider.specialty.id,
            npi: { not: npi },
          },
          take: 4,
          orderBy: { lastName: 'asc' },
        })
      : [];

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
  if (provider.city) {
    breadcrumbs.push({ label: 'California', href: '/ca' });
    breadcrumbs.push({ label: provider.city.name, href: `/ca/${provider.city.slug}` });
    if (provider.specialty) {
      breadcrumbs.push({
        label: provider.specialty.name,
        href: `/ca/${provider.city.slug}/${provider.specialty.slug}`,
      });
    }
  }
  breadcrumbs.push({ label: displayName });

  const providerJsonLd = buildProviderSchema(provider);
  const breadcrumbJsonLd = buildBreadcrumbSchema(
    breadcrumbs.map((b) => ({
      name: b.label,
      url: b.href ? absoluteUrl(b.href) : absoluteUrl(`/provider/${npi}`),
    }))
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(providerJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ViewTracker
        provider={{
          npi,
          name: displayName,
          specialty: provider.specialty?.name ?? null,
          city: provider.city?.name ?? null,
          credentials: provider.credentials ?? npiData?.basic?.credential ?? null,
          ts: Date.now(),
        }}
      />
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pb-20 pt-10">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative mx-auto max-w-5xl px-6">
            <Breadcrumb items={breadcrumbs} light />
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
              <ProviderAvatar
                npi={npi}
                name={displayName}
                isOrg={isOrg}
                className="h-28 w-28 flex-shrink-0 rounded-2xl text-3xl ring-2 ring-white/25"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {provider.specialty && (
                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200 ring-1 ring-white/20">
                      {provider.specialty.name}
                    </span>
                  )}
                  <ShareButton />
                  <BookmarkButton npi={npi} providerName={displayName} />
                </div>
                <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{fullTitle}</h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-brand-200">
                  {provider.city && <span>📍 {provider.city.name}, California</span>}
                  {sexLabel(npiData?.basic?.sex) && <span>· {sexLabel(npiData?.basic?.sex)}</span>}
                  {npiData?.basic?.status === 'A' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active NPI
                    </span>
                  )}
                  {npiData?.basic?.enumeration_date &&
                    (() => {
                      const year = new Date(npiData.basic.enumeration_date).getFullYear();
                      const yrs = new Date().getFullYear() - year;
                      return yrs > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-amber-400/30">
                          In practice since {year} · {yrs} yr{yrs !== 1 ? 's' : ''}
                        </span>
                      ) : null;
                    })()}
                  {provider.acceptsMedicare && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-200 ring-1 ring-blue-400/30">
                      <svg viewBox="0 0 12 12" fill="currentColor" className="h-2.5 w-2.5">
                        <path
                          fillRule="evenodd"
                          d="M10.53 3.47a.75.75 0 0 0-1.06 0L5 7.94 2.53 5.47a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l5-5a.75.75 0 0 0 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Accepts Medicare
                    </span>
                  )}
                  {provider.telehealth && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-medium text-teal-200 ring-1 ring-teal-400/30">
                      <svg viewBox="0 0 12 12" fill="currentColor" className="h-2.5 w-2.5">
                        <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v3A1.5 1.5 0 0 0 1.5 9h6A1.5 1.5 0 0 0 9 7.5V7l2.386 1.193A.5.5 0 0 0 12 7.75v-3.5a.5.5 0 0 0-.614-.457L9 5V4.5A1.5 1.5 0 0 0 7.5 3h-6Z" />
                      </svg>
                      Telehealth
                    </span>
                  )}
                  {provider.acceptingPatients && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Accepting Patients
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column — main details */}
            <div className="space-y-6 lg:col-span-2">
              {/* Contact & Location */}
              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="font-semibold text-gray-900">Contact & Location</h2>
                </div>
                <div className="divide-y divide-gray-50 px-6">
                  {address && (
                    <DetailRow
                      iconBg="bg-emerald-50"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-emerald-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.013 3.5-4.667 3.5-8.077 0-4.698-3.806-8.5-8.5-8.5S3.5 7.302 3.5 12c0 3.41 1.556 6.064 3.5 8.077a19.578 19.578 0 0 0 2.683 2.282c.39.276.78.534 1.143.742ZM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                      label="Practice Address"
                      value={
                        <div>
                          <span>{address}</span>
                          <a
                            href={`https://maps.google.com/?q=${mapsQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-brand-600 hover:underline"
                          >
                            Get directions →
                          </a>
                        </div>
                      }
                    />
                  )}
                  {provider.phone && (
                    <DetailRow
                      iconBg="bg-sky-50"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-sky-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                      label="Phone"
                      value={
                        <a
                          href={`tel:${provider.phone}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {formatPhone(provider.phone)}
                        </a>
                      }
                    />
                  )}
                  {fax && (
                    <DetailRow
                      iconBg="bg-slate-50"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-slate-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.178.18.third 0 .398-.184l-1.5-1.5a.375.375 0 0 0-.531 0l-1.5 1.5a.281.281 0 0 0 .398.398l.977-.979V16.5h.75v-2.795l.978.979a.281.281 0 0 0 .03-.214Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                      label="Fax"
                      value={formatPhone(fax)}
                    />
                  )}
                </div>

                {/* Map */}
                {lat && lng && (
                  <div className="border-t border-gray-100">
                    <iframe
                      title="Provider location"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
                      className="h-48 w-full"
                      loading="lazy"
                    />
                  </div>
                )}
              </section>

              {/* Credentials & Taxonomy */}
              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="font-semibold text-gray-900">Credentials & Taxonomy</h2>
                </div>
                <div className="divide-y divide-gray-50 px-6">
                  {credential && (
                    <DetailRow
                      iconBg="bg-brand-50"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-brand-500"
                        >
                          <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                          <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 0 0 .551-1.608 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.668 2.25 2.25 0 0 0 2.12 0Z" />
                        </svg>
                      }
                      label="Credential"
                      value={<span className="font-semibold text-brand-700">{credential}</span>}
                    />
                  )}
                  <DetailRow
                    iconBg="bg-violet-50"
                    icon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 text-violet-500"
                      >
                        <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                      </svg>
                    }
                    label="Primary Specialty"
                    value={primaryTaxonomy?.desc ?? provider.specialty?.name ?? '—'}
                  />
                  {(provider.medSchool || provider.gradYear) && (
                    <DetailRow
                      iconBg="bg-indigo-50"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-indigo-500"
                        >
                          <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                          <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 0 0 .551-1.608 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.668 2.25 2.25 0 0 0 2.12 0Z" />
                        </svg>
                      }
                      label="Medical Education"
                      value={
                        <span>
                          {provider.medSchool ?? 'School not on record'}
                          {provider.gradYear && (
                            <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              Class of {provider.gradYear}
                            </span>
                          )}
                        </span>
                      }
                    />
                  )}
                  {allTaxonomies.length > 0 && (
                    <div className="py-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        All Taxonomy Codes & Licenses
                      </p>
                      <div className="space-y-2">
                        {allTaxonomies.map((t, i) => (
                          <div
                            key={i}
                            className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                          >
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${t.primary ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-600'}`}
                            >
                              {t.primary ? 'Primary' : 'Secondary'}
                            </span>
                            <span className="font-mono text-xs text-gray-500">{t.code}</span>
                            <span className="text-sm text-gray-900">{t.desc}</span>
                            {t.license && (
                              <span className="ml-auto text-xs text-gray-400">
                                Lic: {t.license} {t.state && `(${t.state})`}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Additional practice locations */}
              {practiceLocations.length > 0 && (
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="font-semibold text-gray-900">
                      Additional Practice Locations
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {practiceLocations.length}
                      </span>
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50 px-6">
                    {practiceLocations.map((loc, i) => {
                      const locAddr = [
                        loc.address_1,
                        loc.address_2,
                        loc.city,
                        loc.state,
                        formatPostalCode(loc.postal_code),
                      ]
                        .filter(Boolean)
                        .join(', ');
                      return (
                        <div key={i} className="flex items-start gap-4 py-4">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">{locAddr}</p>
                            <div className="mt-1 flex gap-4 text-xs text-gray-500">
                              {loc.telephone_number && (
                                <span>📞 {formatPhone(loc.telephone_number)}</span>
                              )}
                              {loc.fax_number && <span>Fax: {formatPhone(loc.fax_number)}</span>}
                            </div>
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(locAddr)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-brand-600 hover:underline"
                          >
                            Directions →
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Quick actions */}
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-900">Quick Actions</h2>
                <div className="space-y-3">
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path
                          fillRule="evenodd"
                          d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Call {formatPhone(provider.phone)}
                    </a>
                  )}
                  {address && (
                    <a
                      href={`https://maps.google.com/?q=${mapsQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 text-emerald-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.013 3.5-4.667 3.5-8.077 0-4.698-3.806-8.5-8.5-8.5S3.5 7.302 3.5 12c0 3.41 1.556 6.064 3.5 8.077a19.578 19.578 0 0 0 2.683 2.282c.39.276.78.534 1.143.742ZM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Get Directions
                    </a>
                  )}
                  <ClaimButton npi={npi} providerName={displayName} />
                  <ReportButton npi={npi} />
                </div>
              </section>

              {/* Provider info */}
              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="font-semibold text-gray-900">Provider Info</h2>
                </div>
                <div className="divide-y divide-gray-50 px-6">
                  <DetailRow
                    iconBg="bg-brand-50"
                    icon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 text-brand-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    }
                    label="NPI Number"
                    value={<span className="font-mono font-semibold">{npi}</span>}
                  />
                  <DetailRow
                    iconBg="bg-amber-50"
                    icon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4 text-amber-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    }
                    label="Provider Type"
                    value={isOrg ? 'Organization' : 'Individual Practitioner'}
                  />
                  {npiData?.basic?.enumeration_date && (
                    <DetailRow
                      iconBg="bg-teal-50"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-teal-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                      label="NPI Enrolled"
                      value={new Date(npiData.basic.enumeration_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    />
                  )}
                  {npiData?.basic?.last_updated && (
                    <DetailRow
                      iconBg="bg-gray-100"
                      icon={
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4 text-gray-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 5.25c1.213 0 2.415.046 3.605.135a3.256 3.256 0 0 1 3.01 3.01c.044.583.077 1.17.1 1.759L17.03 8.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06l-1.752 1.751c-.023-.65-.06-1.296-.108-1.939a4.756 4.756 0 0 0-4.392-4.392 49.422 49.422 0 0 0-7.436 0A4.756 4.756 0 0 0 3.89 8.282c-.017.224-.033.447-.046.672a.75.75 0 1 0 1.497.092c.013-.217.028-.434.044-.651a3.256 3.256 0 0 1 3.01-3.01c1.19-.09 2.392-.135 3.605-.135Zm-6.97 6.22a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.752-1.751c.023.65.06 1.296.108 1.939a4.756 4.756 0 0 0 4.392 4.392 49.413 49.413 0 0 0 7.436 0 4.756 4.756 0 0 0 4.392-4.392c.017-.223.032-.447.046-.672a.75.75 0 0 0-1.497-.092c-.013.217-.028.434-.044.651a3.256 3.256 0 0 1-3.01 3.01 47.953 47.953 0 0 1-7.21 0 3.256 3.256 0 0 1-3.01-3.01 47.759 47.759 0 0 1-.1-1.759L6.97 19.03a.75.75 0 0 0 1.06-1.06l-3-3Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      }
                      label="Last Updated"
                      value={new Date(npiData.basic.last_updated).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    />
                  )}
                </div>
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                  <p className="text-xs text-gray-400">Data sourced from CMS NPPES registry</p>
                </div>
              </section>

              {/* Related providers */}
              {relatedProviders.length > 0 && (
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="font-semibold text-gray-900">Similar Providers</h2>
                    {provider.city && provider.specialty && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {provider.specialty.name} in {provider.city.name}
                      </p>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {relatedProviders.map((rp) => {
                      const rpName =
                        rp.organizationName ??
                        [rp.firstName, rp.lastName].filter(Boolean).join(' ');
                      return (
                        <Link
                          key={rp.npi}
                          href={`/provider/${rp.npi}`}
                          className="group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-brand-50"
                        >
                          <ProviderAvatar
                            npi={rp.npi}
                            name={rpName}
                            className="h-9 w-9 flex-shrink-0 rounded-full"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 group-hover:text-brand-700">
                            {rpName}
                          </span>
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-brand-400"
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
                  {provider.city && provider.specialty && (
                    <div className="border-t border-gray-100 px-6 py-3">
                      <Link
                        href={`/ca/${provider.city.slug}/${provider.specialty.slug}`}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        View all {provider.specialty.name} providers in {provider.city.name} →
                      </Link>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
