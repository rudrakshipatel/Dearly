import { Logo } from "@/components/brand/logo";
import { AuthVisual } from "@/components/auth/auth-visual";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">{children}</main>
      </div>
      <AuthVisual />
    </div>
  );
}
