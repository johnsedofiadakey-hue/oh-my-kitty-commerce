import type { Metadata } from "next";
import { CinematicHome } from "@/components/storefront/cinematic-home";
import {
  getStorefrontCatalogue,
  toStorefrontCategorySummaries,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";
import { getContentBlocks } from "@/lib/storefront/content";

export const metadata: Metadata = {
  title: "Feminine Wellness & Intimate Care in Accra, Ghana",
  description:
    "Shop feminine wellness and intimate care products in Ghana — infection care sets, boric acid, period care, libido support, and more. Order online, on WhatsApp, or pick up in Accra-Madina.",
  alternates: { canonical: "/" }
};

export const dynamic = "force-dynamic";

export default async function StorefrontHomePage() {
  const [catalogue, content] = await Promise.all([getStorefrontCatalogue(), getContentBlocks()]);
  return (
    <CinematicHome
      categories={toStorefrontCategorySummaries(catalogue)}
      products={toStorefrontProductViews(catalogue)}
      whatsappNumber={content["whatsapp-number"]}
    />
  );
}
