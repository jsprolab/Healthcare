import SiteHeader from '@/components/SiteHeader';

export default function ProviderLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pb-20 pt-10 animate-pulse">
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="h-4 w-64 rounded bg-white/20 mb-8" />
          <div className="flex gap-6">
            <div className="h-28 w-28 flex-shrink-0 rounded-2xl bg-white/20" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-4 w-32 rounded bg-white/20" />
              <div className="h-9 w-72 rounded bg-white/25" />
              <div className="flex gap-2 pt-1">
                <div className="h-6 w-28 rounded-full bg-white/15" />
                <div className="h-6 w-24 rounded-full bg-white/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse"
              >
                <div className="border-b border-gray-100 px-6 py-4">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                </div>
                <div className="divide-y divide-gray-50 px-6">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-start gap-4 py-4">
                      <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 rounded bg-gray-100" />
                        <div className="h-4 w-48 rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
              <div className="mb-4 h-4 w-32 rounded bg-gray-200" />
              <div className="space-y-3">
                <div className="h-10 w-full rounded-xl bg-gray-200" />
                <div className="h-10 w-full rounded-xl bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
