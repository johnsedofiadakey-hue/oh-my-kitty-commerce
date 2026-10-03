import type { Metadata } from "next";
import { CinematicHome } from "@/components/storefront/cinematic-home";
import { MatrixHome } from "@/components/storefront/matrix-home";
import { getStorefrontCatalogue, toStorefrontProductViews } from "@/lib/storefront/catalogue";
import { getContentBlocks } from "@/lib/storefront/content";

export const metadata: Metadata = {
  title: "Feminine Wellness & Intimate Care in Accra, Ghana",
  description:
    "Shop feminine wellness and intimate care products in Ghana — infection care sets, boric acid, period care, libido support, and more. Order online, on WhatsApp, or pick up in Accra-Madina.",
  alternates: { canonical: "/" }
};

export const dynamic = "force-dynamic";

export default async function StorefrontHomePage() {
  const catalogue = await getStorefrontCatalogue();

  // The redesign is deliberately opt-in in production. A deploy can carry the
  // new public experience without switching customers away from the proven
  // homepage; HOME_EXPERIENCE=matrix enables it after staging approval.
  const homeExperience = process.env.HOME_EXPERIENCE ?? (process.env.APP_ENV === "production" ? "cinematic" : "matrix");

  if (homeExperience !== "matrix") {
    const content = await getContentBlocks();
    return (
      <CinematicHome
        products={toStorefrontProductViews(catalogue)}
        sourceMessage={catalogue.sourceMessage}
        whatsappNumber={content["whatsapp-number"]}
      />
    );
  }

  return (
    <MatrixHome
      products={toStorefrontProductViews(catalogue)}
      sourceMessage={catalogue.sourceMessage}
    />
  );
}
