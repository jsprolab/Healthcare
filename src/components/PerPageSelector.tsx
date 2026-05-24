'use client';

import { useRouter, usePathname } from 'next/navigation';

const OPTIONS = [
  { label: '25', value: '25' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
  { label: 'All', value: 'all' },
];

interface Props {
  current: string;
  preserveParams?: Record<string, string | undefined>;
}

export default function PerPageSelector({ current, preserveParams = {} }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('pageSize', e.target.value);
    Object.entries(preserveParams).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="per-page" className="whitespace-nowrap text-sm text-gray-500">
        Per page:
      </label>
      <select
        id="per-page"
        value={current}
        onChange={handleChange}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
