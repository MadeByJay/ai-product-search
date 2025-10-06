export default function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-gray-100" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2">
          <div className="h-8 rounded bg-gray-200" />
          <div className="h-8 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
