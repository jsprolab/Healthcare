'use client';

export default function BackButton({
  label = '← Back',
  className = 'text-sm text-gray-500 hover:text-brand-600',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button onClick={() => window.history.back()} className={className}>
      {label}
    </button>
  );
}
