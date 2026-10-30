"use client";

import { useSearchParams } from "next/navigation";
import { VerifyEmailForm } from "./auth-forms";

export function VerifyEmail() {
  const params = useSearchParams();
  return <VerifyEmailForm email={params.get("email") ?? undefined} />;
}
