import Image from "next/image";
import Link from "next/link";
import { getStorefrontDeliveryOptions } from "@/lib/storefront/delivery";

export const dynamic = "force-dynamic";

const DELIVERY_STEPS = [
  { title: "Choose pickup or delivery", description: "Pick your option at checkout — fees update live." },
  { title: "We prepare your order", description: "Your items are packed with care once payment is confirmed." },
  { title: "Collect or receive", description: "Pick up in Accra-Madina, or track your delivery via WhatsApp." }
];

export default async function DeliveryPage() {
  const deliveryOptions = await getStorefrontDeliveryOptions();

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
              {DELIVERY_STEPS.map((step, index) => (
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
                  <strong>{option.fee === 0 ? "Free" : option.formattedFee}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
