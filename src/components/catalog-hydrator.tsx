"use client";

import { hydrateOccasions } from "@/lib/data/occasions";
import { hydrateTemplates } from "@/lib/data/templates";
import type { Occasion, Template } from "@/lib/types";

let hydratedWith: Template[] | null = null;

/** Makes the database catalogue available to client code that looks templates up by id. */
export function CatalogHydrator({ templates, occasions }: { templates: Template[]; occasions: Occasion[] }) {
  if (hydratedWith !== templates) {
    hydrateTemplates(templates);
    hydrateOccasions(occasions);
    hydratedWith = templates;
  }
  return null;
}
