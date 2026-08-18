export function BagIcon({ className = "bag-icon" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M5.5 8h13l-1 12.2a1.6 1.6 0 0 1-1.6 1.5H8.1a1.6 1.6 0 0 1-1.6-1.5L5.5 8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M8.5 8V6.6a3.5 3.5 0 0 1 7 0V8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}
