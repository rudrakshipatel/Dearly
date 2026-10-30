"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { newsletterService } from "@/lib/services";
import { FieldError, Input } from "../ui/form";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const schema = z.object({ email: z.string().email("Please enter a valid email.") });

export function NewsletterForm() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <form
      className="mt-6"
      onSubmit={handleSubmit(async ({ email }) => {
        await newsletterService.subscribe(email);
        reset();
        toast.success({ title: "You're on the list", description: "Occasional ideas and seasonal templates. Never spam." });
      })}
      noValidate
    >
      <label htmlFor="newsletter" className="text-[13px] font-medium text-ink/80">
        Little reminders before the big days
      </label>
      <div className="mt-2 flex gap-2">
        <Input id="newsletter" type="email" placeholder="you@example.com" className="h-10" aria-invalid={!!errors.email} {...register("email")} />
        <Button type="submit" size="icon" className="size-10 shrink-0" aria-label="Subscribe" loading={isSubmitting}>
          {!isSubmitting && <ArrowRight />}
        </Button>
      </div>
      <FieldError message={errors.email?.message} />
    </form>
  );
}
