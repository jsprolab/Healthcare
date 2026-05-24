'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'idle' | 'locating' | 'error';

export default function NearMeButton() {
  const [status, setStatus] = useState<Status>('idle');
  const router = useRouter();

  async function handleClick() {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        router.push(`/ca/near-me?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
      },
      () => setStatus('error'),
      { timeout: 8000 }
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={status === 'locating'}
        className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'locating' ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.013 3.5-4.667 3.5-8.077 0-4.698-3.806-8.5-8.5-8.5S3.5 7.302 3.5 12c0 3.41 1.556 6.064 3.5 8.077a19.578 19.578 0 0 0 2.683 2.282c.39.276.78.534 1.143.742ZM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {status === 'locating' ? 'Getting location…' : 'Near Me'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-rose-300">
          Could not access location. Please enable permissions.
        </p>
      )}
    </div>
  );
}
