'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCompareList, setCompareList, type CompareItem, MAX } from './CompareCheckbox';
import ProviderAvatar from './ProviderAvatar';

export default function CompareBar() {
  const [list, setList] = useState<CompareItem[]>([]);

  useEffect(() => {
    const update = () => setList(getCompareList());
    update();
    window.addEventListener('compare-updated', update);
    return () => window.removeEventListener('compare-updated', update);
  }, []);

  if (list.length === 0) return null;

  const href = `/compare?npis=${list.map((p) => p.npi).join(',')}`;
  const atMax = list.length >= MAX;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-2xl ring-1 ring-black/5">
        <div className="flex -space-x-2">
          {list.map((p) => (
            <ProviderAvatar
              key={p.npi}
              npi={p.npi}
              name={p.name}
              className="h-8 w-8 rounded-full border-2 border-white"
            />
          ))}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {list.length} of {MAX} selected
          </span>
          {atMax && (
            <span className="text-xs text-amber-600">Max reached — remove one to add another</span>
          )}
        </div>
        <Link
          href={href}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Compare →
        </Link>
        <button
          onClick={() => setCompareList([])}
          className="text-xs text-gray-400 hover:text-gray-600"
          aria-label="Clear comparison"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
