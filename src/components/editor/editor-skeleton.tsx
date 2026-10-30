import { Skeleton } from "../ui/misc";

export function EditorSkeleton() {
  return (
    <div className="fixed inset-0 grid grid-rows-[56px_1fr] bg-[#F4EEEA]" aria-busy="true" aria-label="Loading the designer">
      <div className="flex items-center justify-between border-b border-line bg-paper px-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-40 rounded-full" />
      </div>
      <div className="grid place-items-center">
        <Skeleton className="aspect-[3/4] h-[70vh] max-w-[90vw] rounded-sm" />
      </div>
    </div>
  );
}
