import { getAdminOperationsData } from "@/lib/admin/operations-data";
import { requireAdminPermission } from "@/lib/auth/server";
import { CONTENT_REGISTRY, getContentBlocks, isSelectContentKey, type ContentKey } from "@/lib/storefront/content";
import { GeneralMediaUploader } from "@/components/admin/general-media-uploader";
import { ContentBlockRow } from "@/components/admin/content-block-row";
import { DeleteMediaButton } from "@/components/admin/delete-media-button";
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
              <ContentBlockRow
                contentKey={key}
                disabled={disabled}
                group={entry.group}
                key={key}
                label={entry.label}
                options={isSelectContentKey(key) && "options" in entry ? entry.options : undefined}
                updateContentBlockAction={updateContentBlockAction}
                value={content[key]}
              />
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
              <DeleteMediaButton deleteMediaAssetAction={deleteMediaAssetAction} disabled={disabled} mediaId={media.id} />
            </div>
          ))}
          {data.media.length === 0 ? <p className="admin-help">No media uploaded yet.</p> : null}
        </div>
      </section>
    </>
  );
}
