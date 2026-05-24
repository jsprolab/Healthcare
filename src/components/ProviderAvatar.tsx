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

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold ${palette} ${className}`}
      aria-hidden="true"
    >
      <span className="leading-none" style={{ fontSize: '35%' }}>
        {initials}
      </span>
    </div>
  );
}
