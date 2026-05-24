import Link from 'next/link';

export type BreadcrumbItem = { label: string; href?: string };

interface Props {
  items: BreadcrumbItem[];
  light?: boolean;
}

export default function Breadcrumb({ items, light = false }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <span className={`select-none ${light ? 'text-white/30' : 'text-gray-300'}`}>›</span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={
                light
                  ? 'text-white/60 transition-colors hover:text-white'
                  : 'text-gray-500 transition-colors hover:text-brand-600'
              }
            >
              {item.label}
            </Link>
          ) : (
            <span className={`font-medium ${light ? 'text-white/90' : 'text-gray-800'}`}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
