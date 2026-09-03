const icons = {
  overview: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"],
  products: ["M11 3h6a2 2 0 0 1 2 2v6l-9 9-8-8 9-9Z", "M14.5 8.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z"],
  taxonomy: ["M12 3 3 8l9 5 9-5-9-5Z", "M3 13l9 5 9-5"],
  categories: ["M4 4h7v7H4V4Z", "M13 4h7v7h-7V4Z", "M4 13h7v7H4v-7Z", "M13 13h7v7h-7v-7Z"],
  content: [
    "M3 4h18v16H3V4Z",
    "M9 10a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z",
    "M5 18l5-6 4 4 3-3 4 5"
  ],
  orders: ["M6 3h12v18l-3-2-3 2-3-2-3 2V3Z", "M9 8h6M9 12h6"],
  customers: [
    "M9 8a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 8Z",
    "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6",
    "M17.5 9a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z",
    "M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3"
  ],
  promotions: ["M7 7a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 7 7Z", "M17 22a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 17 22Z", "M18 4 6 20"],
  inventory: ["M3 8l9-5 9 5-9 5-9-5Z", "M3 8v9l9 5 9-5V8", "M12 13v9"],
  delivery: [
    "M3 6h11v10H3z",
    "M14 10h4l3 3v3h-7z",
    "M7 20a1.7 1.7 0 1 0 0-3.4A1.7 1.7 0 0 0 7 20Z",
    "M18 20a1.7 1.7 0 1 0 0-3.4A1.7 1.7 0 0 0 18 20Z"
  ],
  reports: ["M4 20V10M11 20V4M18 20v-7", "M2 20h20"],
  audit: ["M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-3Z", "M9 12l2 2 4-4"],
  users: [
    "M9 8a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 8Z",
    "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6",
    "M17.5 9a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z",
    "M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3"
  ],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    "M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
  ],
  alert: ["M12 3 2 20h20L12 3Z", "M12 10v4.5M12 17.4v.1"],
  trendUp: ["M4 17 10 11l4 4 6-8", "M15 7h5v5"],
  pos: ["M4 9h16v11H4Z", "M7 9V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4", "M4 14h16", "M9 17h2"],
  financial: [
    "M12 21a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z",
    "M12 7.5v9M14.8 9.4c0-1-1-1.7-2.3-1.7-1.4 0-2.5.8-2.5 1.9 0 2.7 5 1.3 5 4 0 1.1-1.2 1.9-2.6 1.9-1.4 0-2.4-.7-2.4-1.7"
  ],
  materials: [
    "M9 2h6M10 2v6l-5.2 9a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 8V2",
    "M6.5 15h11"
  ],
  notifications: [
    "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z",
    "M10.3 21a1.7 1.7 0 0 0 3.4 0"
  ]
} as const;

export type AdminIconName = keyof typeof icons;

export function AdminIcon({ name }: { name: AdminIconName }) {
  return (
    <svg
      aria-hidden="true"
      className="admin-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      {icons[name].map((d, index) => (
        <path d={d} key={index} />
      ))}
    </svg>
  );
}
