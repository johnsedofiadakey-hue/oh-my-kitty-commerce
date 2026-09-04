import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuideBySlug, guides } from "@/lib/storefront/guides";
import { buildArticleJsonLd } from "@/lib/seo/structured-data";

type GuidePageParams = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageParams): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: "Guide not found" };
  }

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/learn/${guide.slug}` }
  };
}

export default async function GuidePage({ params }: GuidePageParams) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  return (
    <main className="legal-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticleJsonLd({ title: guide.title, description: guide.description, slug: guide.slug })
          )
        }}
      />
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/leaf-foreground-01.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">{guide.kicker}</span>
        <h1>{guide.title}</h1>
        <div className="legal-card">
          {guide.sections.map((section, index) => (
            <section data-section-number={String(index + 1).padStart(2, "0")} key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
        <div className="learn-guide-actions">
          <Link className="portal-cta" href={`/categories/${guide.relatedCategorySlug}` as Route}>
            <span>{guide.relatedCategoryLabel}</span>
            <i aria-hidden="true" />
          </Link>
          <Link className="portal-cta-secondary" href="/learn">
            More guides
          </Link>
        </div>
      </section>
    </main>
  );
}
