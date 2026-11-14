export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#070f1b] px-5 text-white">
      <div className="text-center" role="status" aria-live="polite">
        <div className="relative mx-auto mb-5 h-12 w-12">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20 motion-reduce:animate-none" />
          <span className="absolute inset-2 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent motion-reduce:animate-none" />
        </div>
        <p className="text-sm font-bold text-slate-200">Loading LiveScore</p>
        <p className="mt-2 text-xs text-slate-500">Preparing the latest football information...</p>
      </div>
    </main>
  );
}
