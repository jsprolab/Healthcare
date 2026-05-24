'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'hn_bookmarks';

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function setBookmarks(npis: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(npis));
}

interface Props {
  npi: string;
  providerName: string;
}

export default function BookmarkButton({ npi, providerName }: Props) {
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setSaved(getBookmarks().includes(npi));
  }, [npi]);

  function toggle() {
    const current = getBookmarks();
    const next = current.includes(npi) ? current.filter((n) => n !== npi) : [...current, npi];
    setBookmarks(next);
    setSaved(!current.includes(npi));
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }

  return (
    <button
      onClick={toggle}
      title={saved ? `Remove ${providerName} from saved` : `Save ${providerName}`}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        saved
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
          : 'bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
      {flash ? (saved ? 'Saved!' : 'Removed') : saved ? 'Saved' : 'Save'}
    </button>
  );
}
