import SiteHeader from '@/components/SiteHeader';

function SkeletonProvider() {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
      <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-20 rounded-full bg-gray-100" />
          <div className="h-5 w-16 rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="h-8 w-16 flex-shrink-0 rounded-lg bg-gray-100" />
    </div>
  );
}

export default function SpecialtyLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pb-16 pt-10 animate-pulse">
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="h-4 w-64 rounded bg-white/20 mb-6" />
          <div className="h-10 w-80 rounded bg-white/20 mb-3" />
          <div className="h-4 w-48 rounded bg-white/10" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex gap-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-gray-200" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProvider key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
