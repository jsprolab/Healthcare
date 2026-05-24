'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
  insurers: { insurer: string; slug: string }[];
  current: string | null;
}

export default function InsuranceSelector({ insurers, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('insurance', e.target.value);
    } else {
      params.delete('insurance');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={current ?? ''}
      onChange={handleChange}
      className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400 ${
        current
          ? 'border-purple-300 bg-purple-600 text-white'
          : 'border-gray-200 bg-white text-gray-600'
      }`}
    >
      <option value="">Insurance: Any</option>
      {insurers.map((plan) => (
        <option key={plan.slug} value={plan.slug}>
          {plan.insurer}
        </option>
      ))}
    </select>
  );
}
