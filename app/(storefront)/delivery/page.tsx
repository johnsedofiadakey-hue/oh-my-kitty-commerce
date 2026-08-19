import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getStorefrontDeliveryOptions } from "@/lib/storefront/delivery";
import { getContentBlocks } from "@/lib/storefront/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery & Pickup",
  description: "Pickup in Accra-Madina, Urgent Delivery, and Free nationwide delivery — options, timing, and fees.",
  alternates: { canonical: "/delivery" }
};

function buildDeliverySteps(pickupLocation: string) {
  return [
    { title: "Choose pickup or delivery", description: "Pick your option at checkout." },
    { title: "We prepare your order", description: "Your items are packed with care once payment is confirmed." },
    { title: "Collect or receive", description: `Pick up in ${pickupLocation}, or track your delivery via WhatsApp.` }
  ];
}

function buildFreeDeliveryNotes(whatsappNumber: string) {
  return [
    "Riders collect orders on Tuesdays and deliver by Saturday at the latest.",
    "If you'll be travelling after ordering, choose Urgent Delivery instead — Free Delivery can't be switched once it's on its way.",
    "Volume, weather, and other factors can delay Free Delivery — thank you for your patience.",
    `Not received by Saturday? Message WhatsApp ${whatsappNumber} that day to follow up.`
  ];
}

export default async function DeliveryPage() {
  const [deliveryOptions, content] = await Promise.all([
    getStorefrontDeliveryOptions(),
    getContentBlocks()
  ]);
  const deliverySteps = buildDeliverySteps(content["pickup-location"]);
  const freeDeliveryNotes = buildFreeDeliveryNotes(content["whatsapp-number"]);

  return (
    <main className="legal-page">
      <div className="legal-page-botanical" aria-hidden="true">
        <Image alt="" fill sizes="260px" src="/hero/botanicals/petals.svg" />
      </div>
      <section className="legal-shell">
        <Link className="brand-mark" href="/">
          Oh My Kitty
        </Link>
        <span className="scene-kicker">Delivery</span>
        <h1>Pickup and delivery.</h1>
        <div className="legal-card">
          <section data-section-number="01">
            <h2>How it works</h2>
            <div className="step-row">
              {deliverySteps.map((step, index) => (
                <div className="step-card" key={step.title}>
                  <strong className="step-number">{index + 1}</strong>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section data-section-number="02">
            <h2>Options and fees</h2>
            <div className="delivery-zone-preview">
              {deliveryOptions.map((option) => (
                <div className="delivery-zone-row" key={option.id}>
                  <div>
                    <strong>{option.name}</strong>
                    {option.estimate ? <span> — {option.estimate}</span> : null}
                  </div>
                  {option.fee > 0 ? <strong>{option.formattedFee}</strong> : null}
                </div>
              ))}
            </div>
          </section>
          <section data-section-number="03">
            <h2>Free Delivery — good to know</h2>
            <ul className="delivery-notice-list">
              {freeDeliveryNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
          <section data-section-number="04">
            <h2>Already ordered?</h2>
            <p>
              <Link href="/track">Track your order</Link> with your order number and phone number.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
