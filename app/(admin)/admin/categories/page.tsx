import { getAdminCategoriesData } from "@/lib/admin/categories";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { CategoryManagementForm } from "@/components/admin/category-management-form";
import { CategoryRow } from "@/components/admin/category-row";
import { requireAdminPermission } from "@/lib/auth/server";
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
              active={category.active}
              attachCategoryImageAction={attachCategoryImageAction}
              disabled={disabled}
              id={category.id}
              imageUrl={category.mediaId ? mediaById.get(category.mediaId)?.url : undefined}
              key={category.id}
              quickEditCategoryAction={quickEditCategoryAction}
              slug={category.slug}
              sortOrder={category.sortOrder}
              title={category.title}
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
