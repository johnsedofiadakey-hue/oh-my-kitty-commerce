const metrics = [
  ["Revenue", "GHS 0"],
  ["Online orders", "0"],
  ["POS sales", "0"],
  ["Low stock", "0"]
];

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="app-title">Store operations</h1>
      <p className="app-subtitle">
        Today&apos;s store activity, order flow, channel totals, and inventory alerts.
      </p>
      <section className="metric-grid" aria-label="Admin metrics">
        {metrics.map(([label, value]) => (
          <article className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
    </>
  );
}
