import SiteHeader from '@/components/SiteHeader';

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function CityLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pb-16 pt-10 animate-pulse">
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="h-4 w-40 rounded bg-white/20 mb-6" />
          <div className="h-12 w-64 rounded bg-white/20 mb-3" />
          <div className="h-4 w-48 rounded bg-white/10" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 h-6 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
