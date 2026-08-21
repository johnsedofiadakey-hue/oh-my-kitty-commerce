import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { CONTENT_REGISTRY, getContentBlocks, isSelectContentKey, type ContentKey } from "@/lib/storefront/content";
import { GeneralMediaUploader } from "@/components/admin/general-media-uploader";
import { deleteMediaAssetAction, updateContentBlockAction, uploadGeneralMediaAction } from "./actions";

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
          <p className="app-subtitle">Editable store copy, plus a library of uploaded images and where each one is used.</p>
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
          {keys.map((key) => {
            const entry = CONTENT_REGISTRY[key];
            return (
              <form action={updateContentBlockAction} className="quick-edit-row" key={key}>
                <input name="key" type="hidden" value={key} />
                <label className="admin-field">
                  <span>{entry.label}</span>
                  {isSelectContentKey(key) && "options" in entry ? (
                    <select defaultValue={content[key]} disabled={disabled} name="value" required>
                      {entry.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input defaultValue={content[key]} disabled={disabled} name="value" required />
                  )}
                </label>
                <label className="admin-field">
                  <span>Used on</span>
                  <input disabled value={entry.group} />
                </label>
                <button className="admin-action" disabled={disabled} type="submit">
                  Save
                </button>
              </form>
            );
          })}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Upload an image</h2>
          <span>Not tied to a product or category — for one-off assets</span>
        </div>
        <GeneralMediaUploader disabled={disabled} onAttach={uploadGeneralMediaAction} />
      </section>
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Media library</h2>
          <span>{data.media.length} asset{data.media.length === 1 ? "" : "s"}</span>
        </div>
        <div className="stack-list">
          {data.media.map((media) => (
            <div className="stack-row" key={media.id}>
              <strong>{media.title ?? media.alt ?? media.id}</strong>
              <span>{media.usage.length > 0 ? media.usage.join(", ") : "general"}</span>
              <a href={media.url} rel="noreferrer" target="_blank">
                {media.url}
              </a>
              <form action={deleteMediaAssetAction}>
                <input name="id" type="hidden" value={media.id} />
                <button className="admin-action ghost small" disabled={disabled} type="submit">
                  Delete
                </button>
              </form>
            </div>
          ))}
          {data.media.length === 0 ? <p className="admin-help">No media uploaded yet.</p> : null}
        </div>
      </section>
    </>
  );
}
