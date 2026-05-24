'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useRef, useTransition } from 'react';

interface Props {
  defaultValue?: string;
  total: number;
}

export default function CitySearchInput({ defaultValue = '', total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value.trim();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        {isPending ? (
          <svg className="h-4 w-4 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={`Search ${total.toLocaleString()} cities…`}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 sm:w-72"
      />
    </div>
  );
}
