import { memo } from 'react';

// Card-shaped placeholders shown while the first load resolves (mirrors LinkCard's box),
// so the user sees structure instead of a bare spinner and layout shift is minimized.
export const LinkGridSkeleton = memo(function LinkGridSkeleton({ count = 8 }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      aria-busy="true"
      aria-label="加载中"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col p-6 pb-16 min-h-[10rem] bg-white rounded-2xl border border-gray-100 animate-pulse"
        >
          <div className="size-10 rounded-lg bg-gray-100 mb-4" />
          <div className="mt-auto">
            <div className="h-4 w-2/3 bg-gray-100 rounded mb-3" />
            <div className="flex gap-1.5">
              <div className="h-4 w-12 bg-gray-50 rounded-full" />
              <div className="h-4 w-10 bg-gray-50 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
