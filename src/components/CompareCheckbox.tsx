'use client';

import { useState, useEffect } from 'react';

const KEY = 'hn_compare';
export const MAX = 3;

export interface CompareItem {
  npi: string;
  name: string;
  specialty: string | null;
  city: string | null;
  credentials: string | null;
  acceptsMedicare: boolean;
  telehealth: boolean;
  gender: string | null;
}

export function getCompareList(): CompareItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function setCompareList(list: CompareItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('compare-updated'));
}

export default function CompareCheckbox({ item }: { item: CompareItem }) {
  const [checked, setChecked] = useState(false);
  const [atMax, setAtMax] = useState(false);

  useEffect(() => {
    const update = () => {
      const list = getCompareList();
      setChecked(list.some((p) => p.npi === item.npi));
      setAtMax(list.length >= MAX);
    };
    update();
    window.addEventListener('compare-updated', update);
    return () => window.removeEventListener('compare-updated', update);
  }, [item.npi]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const list = getCompareList();
    if (checked) {
      setCompareList(list.filter((p) => p.npi !== item.npi));
    } else if (list.length < MAX) {
      setCompareList([...list, item]);
    }
  }

  if (!checked && atMax) {
    return (
      <div
        title="Maximum 3 providers can be compared at once"
        className="absolute right-2 top-2 z-10 flex h-6 w-6 cursor-not-allowed items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50"
      >
        <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 text-gray-300">
          <path
            fillRule="evenodd"
            d="M4.5 2.25a2.25 2.25 0 1 1 4.5 0v1.5h-4.5v-1.5Zm-1.5 1.5v-1.5a3.75 3.75 0 1 1 7.5 0v1.5H12v7.5A1.5 1.5 0 0 1 10.5 12h-9A1.5 1.5 0 0 1 0 10.5V3.75h3Zm4.5 4.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      title={checked ? 'Remove from compare' : 'Add to compare'}
      className={`absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
        checked
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-gray-300 bg-white text-transparent hover:border-brand-400'
      }`}
    >
      <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3">
        <path
          fillRule="evenodd"
          d="M10.53 3.47a.75.75 0 0 0-1.06 0L5 7.94 2.53 5.47a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l5-5a.75.75 0 0 0 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
