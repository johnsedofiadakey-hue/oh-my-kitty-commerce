"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef } from "react";
import { StorefrontNav } from "@/components/storefront/storefront-nav";
import type { Guide } from "@/lib/storefront/guides";

type LearnIndexExperienceProps = {
  guides: Guide[];
};

type GuideExperienceProps = {
  guide: Guide;
  relatedGuides: Guide[];
};

type GuideVisual = {
  image: string;
  accent: string;
  shortLabel: string;
  visualTitle: string;
  chips: string[];
  stages: [string, string, string];
};

const guideVisuals: Record<string, GuideVisual> = {
  "infection-or-normal": {
    image: "/products/infection-set-kit.png",
    accent: "Balance check",
    shortLabel: "Infection signs",
    visualTitle: "Normal, watch, or get help.",
    chips: ["Odor", "Itching", "Discharge", "Burning"],
    stages: ["Normal baseline", "Pay attention", "See a doctor"]
  },
  "boric-acid-explained": {
    image: "/products/boric-acid-suppositories.png",
    accent: "pH guide",
    shortLabel: "Boric acid",
    visualTitle: "How balance support works.",
    chips: ["pH balance", "Night use", "Course length", "Safety"],
    stages: ["Restore balance", "Use as directed", "Know the limits"]
  },
  "odor-and-irritation-day-to-day": {
    image: "/products/feminine-wash.png",
    accent: "Daily care",
    shortLabel: "Odor care",
    visualTitle: "Small habits, calmer days.",
    chips: ["Sweat", "Fabric", "Gentle wash", "Freshness"],
    stages: ["Spot triggers", "Keep it gentle", "Build routine"]
  },
  "choosing-an-infection-set": {
    image: "/products/choosing-infection-set.png",
    accent: "Choose a set",
    shortLabel: "Care sets",
    visualTitle: "Match the set to the moment.",
    chips: ["Mild", "Recurring", "After period", "Unsure"],
    stages: ["Notice", "Match", "Ask us"]
  }
};

const defaultVisual: GuideVisual = {
  image: "/products/feminine-wash.png",
  accent: "Care guide",
  shortLabel: "Guide",
  visualTitle: "Simple care guidance.",
  chips: ["Gentle", "Balanced", "Everyday", "Support"],
  stages: ["Notice", "Understand", "Choose"]
};

const learnHeroProducts = [
  "/products/infection-set-kit.png",
  "/products/feminine-wash.png",
  "/products/boric-acid-suppositories.png"
];

function getVisual(slug: string) {
  return guideVisuals[slug] ?? defaultVisual;
}

function getLead(paragraphs: string[]) {
  const first = paragraphs[0] ?? "";
  const sentence = first.match(/^.+?[.!?](?:\s|$)/)?.[0].trim();
  return sentence || first;
}

function useLearnMotion() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let active = true;
    let context: { revert: () => void } | null = null;

    async function loadMotion() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger")
      ]);

      if (!active || !rootRef.current) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const root = rootRef.current;

        if (!root) {
          return;
        }

        const learnGrid = root.querySelector(".learn-motion-grid");
        const guideFlow = root.querySelector(".guide-flow");

        if (learnGrid) {
          gsap.from(".learn-motion-card", {
            y: 34,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: learnGrid,
              start: "top 78%"
            }
          });
        }

        if (guideFlow) {
          gsap.from(".guide-flow-card", {
            y: 42,
            opacity: 0,
            duration: 0.75,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: guideFlow,
              start: "top 76%"
            }
          });
        }

        if (root.querySelector(".care-orbit-product")) {
          gsap.to(".care-orbit-product", {
            y: -12,
            rotate: 1.5,
            duration: 3.8,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
          });
        }

        if (root.querySelector(".care-orbit-ring")) {
          gsap.to(".care-orbit-ring", {
            rotate: 360,
            duration: 32,
            ease: "none",
            repeat: -1
          });
        }

        if (root.querySelector(".care-petal")) {
          gsap.to(".care-petal", {
            y: -18,
            x: 8,
            duration: 4.6,
            ease: "sine.inOut",
            stagger: 0.18,
            repeat: -1,
            yoyo: true
          });
        }
      }, rootRef);
    }

    void loadMotion();

    return () => {
      active = false;
      context?.revert();
    };
  }, []);

  return rootRef;
}

export function LearnIndexExperience({ guides }: LearnIndexExperienceProps) {
  const rootRef = useLearnMotion();
  const featuredGuide = guides[0];
  const featuredVisual = featuredGuide ? getVisual(featuredGuide.slug) : defaultVisual;
  const allChips = useMemo(
    () => Array.from(new Set(guides.flatMap((guide) => getVisual(guide.slug).chips))).slice(0, 8),
    [guides]
  );

  return (
    <main className="learn-experience-page" ref={rootRef}>
      <StorefrontNav />
      <section className="learn-visual-hero">
        <div className="learn-hero-copy">
          <span className="scene-kicker">Guides &amp; answers</span>
          <h1>Know your body.</h1>
          <p>Quick visual guides for odor, irritation, pH balance, infection care, and everyday confidence.</p>
          <div className="learn-signal-chips" aria-label="Common guide topics">
            {allChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        </div>

        <div className="body-compass" aria-hidden="true">
          <div className="care-orbit-ring ring-a" />
          <div className="care-orbit-ring ring-b" />
          <span className="care-petal petal-a" />
          <span className="care-petal petal-b" />
          <span className="care-petal petal-c" />
          <div className="learn-product-stack">
            {learnHeroProducts.map((image, index) => (
              <div className={`care-orbit-product learn-stack-item stack-${index + 1}`} key={image}>
                <Image alt="" fill loading={index === 0 ? "eager" : undefined} priority={index === 0} sizes="360px" src={image} />
              </div>
            ))}
          </div>
          <div className="care-orbit-label">
            <span>{featuredVisual.accent}</span>
            <strong>{featuredVisual.visualTitle}</strong>
          </div>
        </div>
      </section>

      <section className="learn-choice-section">
        <div className="learn-section-heading">
          <span className="scene-kicker">Choose what fits</span>
          <h2>Tap a visual guide.</h2>
        </div>
        <div className="learn-motion-grid">
          {guides.map((guide) => {
            const visual = getVisual(guide.slug);

            return (
              <Link className="learn-topic-card learn-motion-card" href={`/learn/${guide.slug}` as Route} key={guide.slug}>
                <div className="learn-topic-art" aria-hidden="true">
                  <Image alt="" fill sizes="320px" src={visual.image} />
                  <span>{visual.shortLabel}</span>
                </div>
                <div className="learn-topic-copy">
                  <span className="scene-kicker">{visual.accent}</span>
                  <h2>{guide.title}</h2>
                  <p>{guide.teaser}</p>
                  <strong>Open guide</strong>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export function GuideExperience({ guide, relatedGuides }: GuideExperienceProps) {
  const rootRef = useLearnMotion();
  const visual = getVisual(guide.slug);

  return (
    <main className="learn-experience-page guide-experience-page" ref={rootRef}>
      <StorefrontNav />
      <section className="guide-visual-hero">
        <div className="guide-hero-copy">
          <Link className="brand-mark" href="/learn">
            Know your body
          </Link>
          <span className="scene-kicker">{visual.accent}</span>
          <h1>{guide.title}</h1>
          <p>{guide.description}</p>
          <div className="learn-signal-chips" aria-label="Guide signals">
            {visual.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
          <div className="guide-hero-actions">
            <Link className="portal-cta" href={"/shop" as Route}>
              <span>{guide.shopCtaLabel}</span>
              <i aria-hidden="true" />
            </Link>
            <Link className="portal-cta-secondary" href="/learn">
              More guides
            </Link>
          </div>
        </div>

        <div className="guide-compass" aria-hidden="true">
          <div className="care-orbit-ring ring-a" />
          <div className="care-orbit-ring ring-b" />
          <div className="care-orbit-product">
            <Image alt="" fill loading="eager" priority sizes="380px" src={visual.image} />
          </div>
          {visual.stages.map((stage, index) => (
            <span className={`guide-orbit-chip chip-${index + 1}`} key={stage}>
              {stage}
            </span>
          ))}
        </div>
      </section>

      <section className="guide-flow" aria-label="Guide stages">
        <div className="learn-section-heading">
          <span className="scene-kicker">Simple flow</span>
          <h2>Read it in stages.</h2>
        </div>
        <div className="guide-flow-grid">
          {guide.sections.map((section, index) => (
            <article className="guide-flow-card" data-step={String(index + 1).padStart(2, "0")} key={section.heading}>
              <div className="guide-flow-mark" aria-hidden="true" />
              <h2>{section.heading}</h2>
              <p>{getLead(section.body)}</p>
              <details>
                <summary>Read details</summary>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-care-note">
        <span>Not a diagnosis</span>
        <p>
          These guides help you choose everyday care. If symptoms are severe, painful, persistent, or keep coming back,
          speak with a qualified health professional.
        </p>
      </section>

      {relatedGuides.length > 0 ? (
        <section className="learn-choice-section related-guide-strip">
          <div className="learn-section-heading">
            <span className="scene-kicker">Keep exploring</span>
            <h2>More visual guides.</h2>
          </div>
          <div className="learn-motion-grid compact">
            {relatedGuides.slice(0, 3).map((relatedGuide) => {
              const relatedVisual = getVisual(relatedGuide.slug);

              return (
                <Link
                  className="learn-topic-card learn-motion-card"
                  href={`/learn/${relatedGuide.slug}` as Route}
                  key={relatedGuide.slug}
                >
                  <div className="learn-topic-art" aria-hidden="true">
                    <Image alt="" fill sizes="260px" src={relatedVisual.image} />
                    <span>{relatedVisual.shortLabel}</span>
                  </div>
                  <div className="learn-topic-copy">
                    <span className="scene-kicker">{relatedVisual.accent}</span>
                    <h2>{relatedGuide.title}</h2>
                    <strong>Open guide</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
