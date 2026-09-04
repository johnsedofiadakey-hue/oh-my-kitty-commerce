export type GuideSection = {
  heading: string;
  body: string[];
};

export type Guide = {
  slug: string;
  kicker: string;
  title: string;
  teaser: string;
  description: string;
  sections: GuideSection[];
  relatedCategorySlug: string;
  relatedCategoryLabel: string;
};

/**
 * Deliberately hardcoded, not admin-editable — four short guides don't
 * warrant a content-management system. Non-diagnostic by design: every
 * guide points to a doctor for anything persistent or severe rather than
 * positioning the site as a medical authority.
 */
export const guides: Guide[] = [
  {
    slug: "infection-or-normal",
    kicker: "Know your body",
    title: "Infection or normal? What your body is telling you",
    teaser: "The difference between everyday discharge and signs something's actually wrong.",
    description:
      "How to tell normal, healthy discharge apart from signs of an infection, and when to see a doctor instead of guessing.",
    sections: [
      {
        heading: "What's actually normal",
        body: [
          "Discharge changes throughout your cycle, and that's normal. Clear to milky white, with little to no smell, and no itching or burning, is a healthy baseline — even if the amount or texture shifts from week to week."
        ]
      },
      {
        heading: "Signs worth paying attention to",
        body: [
          "A strong or fishy smell, an unusual color (green, grey, or frothy), itching, burning when you pee, or bleeding outside your period are all worth taking seriously. On their own they don't tell you exactly what's going on, but they're your body's way of flagging that something's off."
        ]
      },
      {
        heading: "What you can do",
        body: [
          "For everyday irritation, odor, or mild discomfort, gentle, purpose-made care — like our Infection Sets — is designed to help restore balance without disrupting your body's natural chemistry the way harsh soaps or douching can."
        ]
      },
      {
        heading: "When to see a doctor",
        body: [
          "If symptoms last more than a few days, keep coming back, or come with pain or fever, that's a sign to see a doctor rather than keep treating it yourself. A product can help with day-to-day care, but it isn't a diagnosis, and it isn't a substitute for medical care when something's genuinely wrong."
        ]
      }
    ],
    relatedCategorySlug: "infection-sets",
    relatedCategoryLabel: "Shop Infection Sets"
  },
  {
    slug: "boric-acid-explained",
    kicker: "Know your body",
    title: "Boric acid, explained",
    teaser: "What it does, how to use it safely, and what it isn't a substitute for.",
    description: "What boric acid suppositories actually do, how to use them safely, and their real limits.",
    sections: [
      {
        heading: "What it actually does",
        body: [
          "Boric acid suppositories are commonly used to help restore a healthy vaginal pH — the kind of balance that gets thrown off by recurring odor, mild yeast imbalance, or bacterial imbalance. They work by gently adjusting that environment, not by masking the symptom."
        ]
      },
      {
        heading: "How to use it safely",
        body: [
          "Suppositories are inserted vaginally, usually at night so they aren't disturbed by movement. Follow the course length on the packaging rather than stopping early or extending it on your own, and always wash your hands before and after.",
          "For external use only, exactly as directed — never taken orally, and kept well away from children."
        ]
      },
      {
        heading: "What it isn't",
        body: [
          "Boric acid isn't a cure-all. It won't treat every type of infection, it isn't recommended during pregnancy without a doctor's guidance, and it isn't a reason to skip a doctor's visit if what you're dealing with is severe, recurring often, or not improving."
        ]
      },
      {
        heading: "When to stop and ask for help",
        body: [
          "If you notice increased irritation, burning, or anything that feels worse rather than better, stop use and check in with a doctor. If in doubt at any point, message us on WhatsApp and we'll help you figure out the right next step."
        ]
      }
    ],
    relatedCategorySlug: "boric-acid-dripping-pills",
    relatedCategoryLabel: "Shop Boric Acid & Dripping Pills"
  },
  {
    slug: "odor-and-irritation-day-to-day",
    kicker: "Know your body",
    title: "Odor and irritation, day to day",
    teaser: "Common causes, what actually helps, and what tends to make it worse.",
    description: "The everyday causes of odor and irritation, what genuinely helps, and habits that tend to make things worse.",
    sections: [
      {
        heading: "Common, everyday causes",
        body: [
          "Sweat, tight or synthetic clothing, staying in a wet swimsuit or gym clothes too long, and even laundry detergent residue can all cause everyday odor or irritation. It's rarely one dramatic cause — usually it's a build-up of small, ordinary things."
        ]
      },
      {
        heading: "What actually helps",
        body: [
          "Breathable cotton underwear, changing out of damp or sweaty clothing promptly, and a gentle, pH-balanced wash made for intimate skin rather than regular scented soap all make a real difference day to day."
        ]
      },
      {
        heading: "What makes it worse",
        body: [
          "Douching, scented sprays or wipes, and over-washing all disrupt your body's natural balance rather than protecting it — often making odor and irritation worse, not better, even though they're marketed as the fix."
        ]
      },
      {
        heading: "A simple daily routine",
        body: [
          "Keep it simple: a gentle wash, breathable fabric, and changing out of damp clothing when you can. Our Daily Intimate Care range is built around exactly this — everyday upkeep, not a treatment for a problem."
        ]
      }
    ],
    relatedCategorySlug: "daily-intimate-care",
    relatedCategoryLabel: "Shop Daily Intimate Care"
  },
  {
    slug: "choosing-an-infection-set",
    kicker: "Know your body",
    title: "Choosing between our infection care sets",
    teaser: "A practical guide to picking the right set for your situation.",
    description: "How to think through which Infection Set fits what you're actually dealing with.",
    sections: [
      {
        heading: "What's in a set",
        body: [
          "Our Infection Sets bundle the products people typically reach for together — an internal suppository, an external wash, and everyday support — rather than making you guess which single product to buy on its own."
        ]
      },
      {
        heading: "Matching a set to what you're feeling",
        body: [
          "If it's mild, everyday odor or discomfort, a lighter set built for daily upkeep is usually the right start. If symptoms feel more noticeable — stronger odor, more irritation, or discomfort that's new — a more targeted set is worth considering instead."
        ]
      },
      {
        heading: "Still not sure? Ask us",
        body: [
          "This guide is here to help you think it through, not to diagnose anything. If you're not sure which set fits, message us on WhatsApp and describe what you're noticing — we're happy to help you choose. And if what you're dealing with is severe, sudden, or not improving, a doctor is always the right first call."
        ]
      }
    ],
    relatedCategorySlug: "infection-sets",
    relatedCategoryLabel: "Shop Infection Sets"
  }
];

export function getGuideBySlug(slug: string) {
  return guides.find((guide) => guide.slug === slug) ?? null;
}
