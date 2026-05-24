'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const ICON_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-indigo-100 text-indigo-600',
  'bg-violet-100 text-violet-600',
  'bg-pink-100 text-pink-600',
  'bg-rose-100 text-rose-600',
  'bg-orange-100 text-orange-600',
  'bg-amber-100 text-amber-600',
  'bg-teal-100 text-teal-600',
  'bg-cyan-100 text-cyan-600',
  'bg-sky-100 text-sky-600',
  'bg-emerald-100 text-emerald-600',
  'bg-green-100 text-green-600',
  'bg-lime-100 text-lime-600',
  'bg-purple-100 text-purple-600',
  'bg-fuchsia-100 text-fuchsia-600',
  'bg-slate-100 text-slate-600',
];

const ACTIVE_RING_COLORS = [
  'ring-blue-300 border-blue-300 bg-blue-50',
  'ring-indigo-300 border-indigo-300 bg-indigo-50',
  'ring-violet-300 border-violet-300 bg-violet-50',
  'ring-pink-300 border-pink-300 bg-pink-50',
  'ring-rose-300 border-rose-300 bg-rose-50',
  'ring-orange-300 border-orange-300 bg-orange-50',
  'ring-amber-300 border-amber-300 bg-amber-50',
  'ring-teal-300 border-teal-300 bg-teal-50',
  'ring-cyan-300 border-cyan-300 bg-cyan-50',
  'ring-sky-300 border-sky-300 bg-sky-50',
  'ring-emerald-300 border-emerald-300 bg-emerald-50',
  'ring-green-300 border-green-300 bg-green-50',
  'ring-lime-300 border-lime-300 bg-lime-50',
  'ring-purple-300 border-purple-300 bg-purple-50',
  'ring-fuchsia-300 border-fuchsia-300 bg-fuchsia-50',
  'ring-slate-300 border-slate-300 bg-slate-50',
];

const PANEL_COLORS = [
  'border-blue-200 bg-blue-50/60',
  'border-indigo-200 bg-indigo-50/60',
  'border-violet-200 bg-violet-50/60',
  'border-pink-200 bg-pink-50/60',
  'border-rose-200 bg-rose-50/60',
  'border-orange-200 bg-orange-50/60',
  'border-amber-200 bg-amber-50/60',
  'border-teal-200 bg-teal-50/60',
  'border-cyan-200 bg-cyan-50/60',
  'border-sky-200 bg-sky-50/60',
  'border-emerald-200 bg-emerald-50/60',
  'border-green-200 bg-green-50/60',
  'border-lime-200 bg-lime-50/60',
  'border-purple-200 bg-purple-50/60',
  'border-fuchsia-200 bg-fuchsia-50/60',
  'border-slate-200 bg-slate-50/60',
];

export interface SpecialtyItem {
  slug: string;
  name: string;
  providerCount: number;
  description?: string | null;
}

export interface CityItem {
  slug: string;
  name: string;
  providerCount: number;
}

interface Props {
  specialties: SpecialtyItem[];
  cities: CityItem[];
}

// Truncate to first sentence, max 90 chars
function shortDesc(text: string): string {
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return first.length > 90 ? first.slice(0, 88) + '…' : first;
}

function SpecialtyCard({
  specialty,
  index,
  isActive,
  onToggle,
}: {
  specialty: SpecialtyItem;
  index: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const iconColor = ICON_COLORS[index % ICON_COLORS.length];
  const activeRing = ACTIVE_RING_COLORS[index % ACTIVE_RING_COLORS.length];

  const desc = specialty.description ?? null;
  const short = desc ? shortDesc(desc) : null;
  const hasMore = desc && short && desc !== short && !desc.endsWith(short.replace('…', ''));

  return (
    <div
      className={[
        'group flex cursor-pointer flex-col rounded-xl border shadow-sm transition-all',
        isActive
          ? `ring-1 ${activeRing}`
          : 'border-gray-100 bg-white hover:border-brand-200 hover:bg-brand-50 hover:shadow-md',
      ].join(' ')}
    >
      {/* Main clickable row */}
      <button
        type="button"
        aria-expanded={isActive}
        onClick={onToggle}
        className="flex items-center gap-3 p-4 text-left"
      >
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconColor}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`block text-sm font-medium leading-snug ${isActive ? 'text-gray-900' : 'text-gray-800'}`}
          >
            {specialty.name}
          </span>
          <span className="text-xs text-gray-400">
            {specialty.providerCount.toLocaleString()} providers
          </span>
        </div>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 flex-shrink-0 transition-all ${isActive ? 'rotate-180 text-brand-500' : 'text-gray-300 group-hover:text-brand-400'}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Description area */}
      {desc && (
        <div className="border-t border-gray-100/80 px-4 pb-3 pt-2">
          <p className="text-xs leading-relaxed text-gray-500">{expanded ? desc : short}</p>
          {hasMore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              {expanded ? 'Show less ↑' : 'Show more ↓'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SpecialtyGrid({ specialties, cities }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeIndex = specialties.findIndex((s) => s.slug === activeSlug);
  const activeSpecialty = activeIndex >= 0 ? specialties[activeIndex] : null;

  function handleToggle(slug: string) {
    setActiveSlug((prev) => (prev === slug ? null : slug));
  }

  // Fetch per-specialty city counts whenever the selected specialty changes
  useEffect(() => {
    if (!activeSlug) return;
    const citySlugs = cities.map((c) => c.slug).join(',');
    setCountsLoading(true);
    fetch(`/api/specialty-cities?specialty=${activeSlug}&cities=${citySlugs}`)
      .then((r) => r.json())
      .then((data: Record<string, number>) => {
        setCityCounts(data);
        setCountsLoading(false);
      })
      .catch(() => setCountsLoading(false));
  }, [activeSlug, cities]);

  useEffect(() => {
    if (activeSlug && panelRef.current) {
      const id = setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
      return () => clearTimeout(id);
    }
  }, [activeSlug]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {specialties.map((specialty, i) => (
          <SpecialtyCard
            key={specialty.slug}
            specialty={specialty}
            index={i}
            isActive={activeSlug === specialty.slug}
            onToggle={() => handleToggle(specialty.slug)}
          />
        ))}
      </div>

      {/* City picker panel */}
      {activeSpecialty && (
        <div
          ref={panelRef}
          className={`mt-4 rounded-2xl border p-6 ${PANEL_COLORS[activeIndex % PANEL_COLORS.length]}`}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Browsing specialty
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-gray-900">{activeSpecialty.name}</h3>
              {activeSpecialty.description && (
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
                  {activeSpecialty.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveSlug(null)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/60 hover:text-gray-700"
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <p className="mb-4 text-sm text-gray-500">
            Select a California city to browse{' '}
            <span className="font-medium text-gray-700">{activeSpecialty.name}</span> providers
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cities.map((city) => {
              const count = cityCounts[city.slug];
              return (
                <Link
                  key={city.slug}
                  href={`/ca/${city.slug}/${activeSpecialty.slug}`}
                  className="group flex flex-col rounded-xl border border-white/80 bg-white px-4 py-3 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
                >
                  <span className="text-sm font-semibold text-gray-800 transition-colors group-hover:text-brand-700">
                    {city.name}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-400">
                    {countsLoading ? (
                      <span className="inline-block h-3 w-12 animate-pulse rounded bg-gray-200" />
                    ) : count != null ? (
                      `${count.toLocaleString()} providers`
                    ) : (
                      'No providers'
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
