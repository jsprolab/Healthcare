'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-gray-700">Something went wrong.</p>
      <button onClick={reset} className="text-sm text-brand-600 underline">
        Try again
      </button>
    </main>
  );
}
