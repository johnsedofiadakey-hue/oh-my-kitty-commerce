import Image from "next/image";
import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { CONTENT_REGISTRY, getContentBlocks, type ContentKey } from "@/lib/storefront/content";
import { updateContentBlockAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdminPermission("content.view");
  const [data, content] = await Promise.all([getAdminOperationsData(), getContentBlocks()]);
  const disabled = data.source !== "live";
  const keys = Object.keys(CONTENT_REGISTRY) as ContentKey[];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Content &amp; Media</h1>
          <p className="app-subtitle">Homepage media, product cutouts, public assets, and editable store content.</p>
        </div>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Site content</h2>
          <span>Changes appear on the storefront immediately</span>
        </div>
        <div className="quick-edit-list">
          {keys.map((key) => (
            <form action={updateContentBlockAction} className="quick-edit-row" key={key}>
              <input name="key" type="hidden" value={key} />
              <label className="admin-field">
                <span>{CONTENT_REGISTRY[key].label}</span>
                <input defaultValue={content[key]} disabled={disabled} name="value" required />
              </label>
              <label className="admin-field">
                <span>Used on</span>
                <input disabled value={CONTENT_REGISTRY[key].group} />
              </label>
              <button className="admin-action" disabled={disabled} type="submit">
                Save
              </button>
            </form>
          ))}
        </div>
      </section>
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
            {data.media.length === 0 ? (
              <p className="admin-help">
                No media uploaded yet — upload from Firebase Storage isn&apos;t wired up here yet.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
