"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { contactService } from "@/lib/services";
import { Button } from "../ui/button";
import { Field, Input, Select, Textarea } from "../ui/form";

const schema = z.object({
  name: z.string().trim().min(1, "Please tell us your name."),
  email: z.string().email("Please enter a valid email address."),
  topic: z.string().min(1, "Choose a topic."),
  message: z.string().trim().min(10, "A little more detail helps us help you (10+ characters).").max(2000),
});
type Values = z.infer<typeof schema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { topic: "" } });

  if (sent)
    return (
      <div className="flex flex-col items-start rounded-[24px] border border-line bg-paper p-8">
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-burgundy text-ivory">
          <Check className="size-5" />
        </span>
        <h2 className="font-display text-4xl">Thank you — message received.</h2>
        <p className="mt-3 text-[15px] text-muted">We&apos;ll reply to you by email, usually within one working day.</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );

  return (
    <form
      noValidate
      className="space-y-5 rounded-[24px] border border-line bg-paper p-6 sm:p-8"
      onSubmit={handleSubmit(async (v) => {
        await contactService.send(v);
        reset();
        setSent(true);
      })}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
      </div>
      <Field label="Topic" htmlFor="topic" error={errors.topic?.message}>
        <Select id="topic" aria-invalid={!!errors.topic} {...register("topic")}>
          <option value="" disabled>
            Choose a topic…
          </option>
          <option>A card I sent or received</option>
          <option>Billing & plans</option>
          <option>Ideas & feedback</option>
          <option>Partnerships</option>
          <option>Something else</option>
        </Select>
      </Field>
      <Field label="Message" htmlFor="message" error={errors.message?.message}>
        <Textarea id="message" rows={6} aria-invalid={!!errors.message} {...register("message")} />
      </Field>
      <Button type="submit" size="lg" loading={isSubmitting}>
        Send message
      </Button>
    </form>
  );
}
