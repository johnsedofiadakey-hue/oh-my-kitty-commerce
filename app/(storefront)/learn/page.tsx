import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { guides } from "@/lib/storefront/guides";

export const metadata: Metadata = {
  title: "Guides & Answers",
  description:
    "Straight answers on infections, odor, and everyday intimate care — no shame, just facts, from Oh My Kitty.",
  alternates: { canonical: "/learn" }
};

export default function LearnIndexPage() {
  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      <section className="legal-shell learn-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Guides &amp; answers</span>
        <h1>Know your body.</h1>
        <p className="learn-intro">
          Straight answers on infections, odor, and everyday intimate care — no shame, just facts.
        </p>
        <div className="learn-grid">
          {guides.map((guide) => (
            <Link className="learn-card" href={`/learn/${guide.slug}`} key={guide.slug}>
              <span className="scene-kicker">{guide.kicker}</span>
              <h2>{guide.title}</h2>
              <p>{guide.teaser}</p>
              <span className="learn-card-cta">Read more</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
