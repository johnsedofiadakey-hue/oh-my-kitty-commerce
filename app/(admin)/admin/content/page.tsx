import Image from "next/image";
import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdminPermission("content.view");
  const data = await getAdminOperationsData();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Content & Media</h1>
          <p className="app-subtitle">Homepage media, product cutouts, public assets, and editable store content.</p>
        </div>
        <button className="admin-action" type="button">
          Upload media
        </button>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-grid two">
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Brand logo</h2>
            <span>Current asset</span>
          </div>
          <div className="brand-preview">
            <Image
              src="/brand/oh-my-kitty-logo.jpeg"
              alt="Oh My Kitty logo"
              width={280}
              height={280}
            />
          </div>
        </div>
        <div className="admin-panel">
          <div className="panel-header">
            <h2>Media library</h2>
            <span>{data.media.length} asset</span>
          </div>
          <div className="stack-list">
            {data.media.map((media) => (
              <div className="stack-row" key={media.id}>
                <strong>{media.title ?? media.id}</strong>
                <span>
                  {media.type} / {media.visibility} / {media.usage.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Editable content areas</h2>
          <span>CMS map</span>
        </div>
        <div className="admin-table four">
          <div className="admin-table-row header">
            <span>Area</span>
            <span>Owner</span>
            <span>Status</span>
            <span>Notes</span>
          </div>
          {[
            ["Homepage microcopy", "Content", "Draft", "Minimal storefront copy"],
            ["FAQ", "Support", "Draft", "Customer trust content"],
            ["Delivery text", "Operations", "Draft", "Matches delivery rules"],
            ["Policy pages", "Owner", "Draft", "Client-approved wording required"]
          ].map(([area, owner, status, notes]) => (
            <div className="admin-table-row" key={area}>
              <strong>{area}</strong>
              <span>{owner}</span>
              <span>{status}</span>
              <span>{notes}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
