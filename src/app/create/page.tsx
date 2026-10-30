import type { Metadata } from "next";
import { CreateWizard } from "@/components/create/create-wizard";

export const metadata: Metadata = {
  title: "Create",
  description: "Choose an occasion and an experience, make it personal and share something unforgettable.",
};

export default function CreatePage() {
  return <CreateWizard />;
}
