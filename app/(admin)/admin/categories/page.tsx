import { getAdminCategoriesData } from "@/lib/admin/categories";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CategoryManagementForm } from "@/components/admin/category-management-form";
import { CategoryImageUploader } from "@/components/admin/category-image-uploader";
import { requireAdminPermission } from "@/lib/auth/server";
import type { Category, MediaAsset } from "@/lib/commerce/types";
import { attachCategoryImageAction, createCategoryAction, quickEditCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPermission("products.view");
  const data = await getAdminCategoriesData();
  const disabled = data.source !== "live";
  const mediaById = new Map(data.media.map((asset) => [asset.id, asset]));
  const categories = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="app-title">Categories</h1>
          <p className="app-subtitle">
            The category tiles customers browse on the homepage and shop — title, photo, and display order.
          </p>
        </div>
        <AdminDrawer title="New category" triggerLabel="New category">
          <CategoryManagementForm createCategoryAction={createCategoryAction} disabled={disabled} />
        </AdminDrawer>
      </div>
      {data.sourceMessage ? (
        <div className="admin-alert" role="status">
          {data.sourceMessage}
        </div>
      ) : null}
      <section className="admin-panel">
        <div className="panel-header">
          <h2>Category tiles</h2>
          <span>{categories.length} categories</span>
        </div>
        <div className="quick-edit-list">
          {categories.map((category) => (
            <CategoryRow
              category={category}
              disabled={disabled}
              image={category.mediaId ? mediaById.get(category.mediaId) : undefined}
              key={category.id}
            />
          ))}
          {categories.length === 0 ? (
            <p className="admin-help">
              No categories yet — use &quot;New category&quot; above to create the first one.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function CategoryRow({
  category,
  disabled,
  image
}: {
  category: Category;
  disabled: boolean;
  image?: MediaAsset;
}) {
  return (
    <form action={quickEditCategoryAction} className="quick-edit-row">
      <input name="id" type="hidden" value={category.id} />
      <CategoryImageUploader
        alt={category.title}
        categoryId={category.id}
        currentImageUrl={image?.url}
        disabled={disabled}
        onAttach={attachCategoryImageAction}
      />
      <label className="admin-field">
        <span>Title</span>
        <input defaultValue={category.title} disabled={disabled} name="title" required />
      </label>
      <label className="admin-field">
        <span>Slug</span>
        <input disabled value={category.slug} />
      </label>
      <label className="admin-field">
        <span>Sort order</span>
        <input
          defaultValue={category.sortOrder}
          disabled={disabled}
          inputMode="numeric"
          min="0"
          name="sortOrder"
        />
      </label>
      <label className="admin-field checkbox">
        <input defaultChecked={category.active} disabled={disabled} name="active" type="checkbox" />
        <span>Active</span>
      </label>
      <button className="admin-action" disabled={disabled} type="submit">
        Save
      </button>
    </form>
  );
}
