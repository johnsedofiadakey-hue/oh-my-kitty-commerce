import Link from "next/link";

export default function AdminNotFound() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Page not found</h1>
          <p className="app-subtitle">That admin page doesn&apos;t exist or may have moved.</p>
        </div>
      </div>
      <div className="admin-panel">
        <div className="panel-header">
          <h2>Try one of these instead</h2>
        </div>
        <div className="admin-empty-panel">
          <Link href="/admin">Go to the dashboard</Link>
        </div>
      </div>
    </>
  );
}
