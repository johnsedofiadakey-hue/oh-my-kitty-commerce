import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideExperience } from "@/components/storefront/learn-experience";
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticleJsonLd({ title: guide.title, description: guide.description, slug: guide.slug })
          )
        }}
      />
      <GuideExperience guide={guide} relatedGuides={guides.filter((entry) => entry.slug !== guide.slug)} />
    </>
  );
}
