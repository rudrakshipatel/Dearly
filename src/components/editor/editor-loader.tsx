"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buildCreation } from "@/lib/creation";
import { getTemplate } from "@/lib/data/templates";
import { ApiClientError, creationService } from "@/lib/services";
import type { Creation } from "@/lib/types";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/misc";
import { EditorShell } from "./editor-shell";
import { EditorSkeleton } from "./editor-skeleton";

export function EditorLoader({ id }: { id: string }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "missing" } | { status: "ready"; creation: Creation }>({ status: "loading" });
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (id === "demo") {
          // A ready-made draft so anyone signed in can try the designer straight away.
          const c = await creationService.create(
            buildCreation({ template: getTemplate("tpl-confetti-cake")!, recipientName: "Maya", senderName: "Jonah", photos: [{ id: "p1", src: "scene:picnic", caption: "June picnic" }] }),
          );
          router.replace(`/editor/${c.id}`);
          return;
        }
        const c = await creationService.get(id);
        if (alive) setState({ status: "ready", creation: c });
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiClientError && e.isAuth) router.replace(`/sign-in?next=/editor/${id}`);
        else setState({ status: "missing" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, router]);

  if (state.status === "loading") return <EditorSkeleton />;
  if (state.status === "missing")
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <EmptyState
          icon={<FileQuestion className="size-8 text-muted" />}
          title="We couldn't find that draft"
          description="It may have been deleted, or it belongs to a different account."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/create">Start something new</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">My creations</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  return <EditorShell initial={state.creation} />;
}
