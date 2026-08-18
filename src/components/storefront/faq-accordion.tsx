"use client";

import { useState } from "react";

export type FaqEntry = {
  question: string;
  answer: string;
};

export function FaqAccordion({ entries }: { entries: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-accordion">
      {entries.map((entry, index) => {
        const open = openIndex === index;

        return (
          <div className="faq-row" data-open={open} key={entry.question}>
            <button
              aria-expanded={open}
              className="faq-trigger"
              onClick={() => setOpenIndex(open ? null : index)}
              type="button"
            >
              <h2>{entry.question}</h2>
              <PlusIcon className="faq-arrow" />
            </button>
            <div className="faq-answer">
              <p>{entry.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
