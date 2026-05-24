'use client';

import { useEffect } from 'react';

const KEY = 'hn_recent';
const MAX = 8;

export interface RecentProvider {
  npi: string;
  name: string;
  specialty: string | null;
  city: string | null;
  credentials: string | null;
  ts: number;
}

export function getRecentProviders(): RecentProvider[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export default function ViewTracker({ provider }: { provider: RecentProvider }) {
  useEffect(() => {
    const list = getRecentProviders().filter((p) => p.npi !== provider.npi);
    localStorage.setItem(
      KEY,
      JSON.stringify([{ ...provider, ts: Date.now() }, ...list].slice(0, MAX))
    );
  }, [provider]);

  return null;
}
