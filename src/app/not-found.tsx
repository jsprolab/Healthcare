import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404 – Not Found' };

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">404 – Page not found.</p>
    </main>
  );
}
