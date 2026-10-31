import { Skeleton } from "../ui/misc";

export function AdminSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-6 h-72 w-full" />
    </div>
  );
}
