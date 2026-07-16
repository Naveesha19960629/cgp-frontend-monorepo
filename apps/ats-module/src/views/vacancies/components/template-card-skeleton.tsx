import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';

/** Loading placeholder matching the dimensions of {@link TemplateCard}. */
export default function TemplateCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#d4d4d4] bg-white">
      <div className="flex flex-1 flex-col px-4 pt-4 pb-5">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="mt-4 h-7 w-3/4" />
        <Skeleton className="mt-2 h-6 w-1/2" />
      </div>

      <div className="flex items-center justify-between border-t border-[#d4d4d4] bg-[#f5f5f5] px-4 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="size-10 rounded-lg" />
        </div>

        <Skeleton className="h-5 w-28" />
      </div>
    </article>
  );
}
