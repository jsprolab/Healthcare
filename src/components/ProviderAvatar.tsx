'use client';

import { useState } from 'react';

const PALETTES = [
  'bg-brand-100 text-brand-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

interface Props {
  npi: string;
  name: string;
  isOrg?: boolean;
  className?: string;
}

export default function ProviderAvatar({
  npi,
  name,
  isOrg = false,
  className = 'h-12 w-12',
}: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const palette = PALETTES[parseInt(npi.slice(-2), 10) % PALETTES.length];

  const initials = isOrg
    ? name
        .replace(/[^A-Za-z\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() ||
      name[0]?.toUpperCase() ||
      '?'
    : name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || '?';

  const showImg = imgLoaded && !imgError;

  return (
    <div className={`relative flex-shrink-0 ${className}`} aria-hidden="true">
      {/* Initials — visible until image loads */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-full font-semibold transition-opacity duration-200 ${palette} ${showImg ? 'opacity-0' : 'opacity-100'}`}
      >
        <span className="leading-none" style={{ fontSize: '35%' }}>
          {initials}
        </span>
      </div>

      {/* DiceBear image — loads lazily, fades in when ready */}
      {!imgError && (
        <img
          src={`https://api.dicebear.com/9.x/micah/svg?seed=${npi}`}
          alt=""
          loading="lazy"
          fetchPriority="low"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-200 ${showImg ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
