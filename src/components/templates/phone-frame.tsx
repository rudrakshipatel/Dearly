import { cn } from "@/lib/utils";

export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-[9/18.5] w-full max-w-[320px] rounded-[44px] bg-ink p-[10px] shadow-[0_40px_80px_-40px_rgba(41,37,42,.6)]", className)}>
      <div className="absolute left-1/2 top-[18px] z-20 h-[22px] w-[34%] -translate-x-1/2 rounded-full bg-ink" aria-hidden />
      <div className="relative size-full overflow-hidden rounded-[34px] bg-ivory">{children}</div>
    </div>
  );
}
