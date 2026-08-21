import { buildSocialCard, socialCardSize } from "@/lib/seo/social-card";

export const alt = "Oh My Kitty — Intimate care, naturally.";
export const size = socialCardSize;
export const contentType = "image/png";

export default function Image() {
  return buildSocialCard();
}
