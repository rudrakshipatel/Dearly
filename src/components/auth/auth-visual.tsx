import { MotifArt } from "../art/motif";
import { Scene } from "../art/scene";

export function AuthVisual() {
  return (
    <aside className="relative hidden overflow-hidden bg-blush lg:block" aria-hidden>
      <div className="paper-grain absolute inset-0" />
      <div className="absolute -right-20 -top-20 size-96 rounded-full bg-lavender/50 blur-3xl" />
      <figure className="absolute left-[14%] top-[14%] w-[34%] rotate-[-8deg] bg-white p-3 pb-0 shadow-paper">
        <div className="aspect-square overflow-hidden">
          <Scene name="lake" />
        </div>
        <figcaption className="py-3 text-center font-hand text-2xl text-ink/75">the lake house</figcaption>
      </figure>
      <figure className="absolute right-[12%] top-[28%] w-[30%] rotate-[7deg] bg-white p-3 pb-0 shadow-paper">
        <div className="aspect-square overflow-hidden">
          <Scene name="meadow" />
        </div>
        <figcaption className="py-3 text-center font-hand text-2xl text-ink/75">Sundays</figcaption>
      </figure>
      <MotifArt motif="envelope" palette="rose-cream" className="absolute bottom-[18%] left-[18%] w-[40%] rotate-[-4deg]" />
      <MotifArt motif="floral" palette="blush-gold" className="absolute bottom-[6%] right-[10%] w-[28%]" />
      <blockquote className="absolute bottom-10 left-10 right-10 max-w-sm">
        <p className="font-display text-3xl italic leading-tight text-ink">&ldquo;More than a card. A memory.&rdquo;</p>
      </blockquote>
    </aside>
  );
}
