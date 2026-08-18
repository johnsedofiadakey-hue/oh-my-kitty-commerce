import { CinematicHome } from "@/components/storefront/cinematic-home";
import {
  getStorefrontCatalogue,
  toStorefrontCategorySummaries,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function StorefrontHomePage() {
  const catalogue = await getStorefrontCatalogue();
  return (
    <CinematicHome
      categories={toStorefrontCategorySummaries(catalogue)}
      products={toStorefrontProductViews(catalogue)}
    />
  );
}
