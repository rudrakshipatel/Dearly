import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorLoader } from "@/components/editor/editor-loader";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";

export const metadata: Metadata = {
  title: "Designer",
  robots: { index: false },
};

export default function EditorPage({ params }: PageProps<"/editor/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      {params.then(({ id }) => (
        <EditorLoader id={id} />
      ))}
    </Suspense>
  );
}
