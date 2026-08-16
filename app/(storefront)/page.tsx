import { CinematicHome } from "@/components/storefront/cinematic-home";
import {
  getStorefrontCatalogue,
  toStorefrontProductViews
} from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export default async function StorefrontHomePage() {
  const catalogue = await getStorefrontCatalogue();
  return <CinematicHome products={toStorefrontProductViews(catalogue)} />;
}
