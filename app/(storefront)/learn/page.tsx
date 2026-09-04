import type { Metadata } from "next";
import { LearnIndexExperience } from "@/components/storefront/learn-experience";
import { guides } from "@/lib/storefront/guides";

export const metadata: Metadata = {
  title: "Guides & Answers",
  description:
    "Straight answers on infections, odor, and everyday intimate care — no shame, just facts, from Oh My Kitty.",
  alternates: { canonical: "/learn" }
};

export default function LearnIndexPage() {
  return <LearnIndexExperience guides={guides} />;
}
