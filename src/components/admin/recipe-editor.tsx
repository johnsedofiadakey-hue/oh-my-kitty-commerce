"use client";

import { useActionState, useState } from "react";
import { initialAdminActionState, type AdminFormAction } from "@/lib/admin/product-form";
import { formatMoney } from "@/lib/commerce/format";

export type RecipeMaterial = {
  id: string;
  name: string;
  unit: string;
  kind: "INGREDIENT" | "PACKAGING" | "OTHER";
  costPerUnit: number;
};

export type RecipeTarget = {
  productId: string;
  variantId: string;
  label: string;
  price: number;
  quantities: Record<string, number>;
};

const KIND_LABEL: Record<RecipeMaterial["kind"], string> = {
  INGREDIENT: "Ingredients",
  PACKAGING: "Packaging",
  OTHER: "Other"
};

/**
 * The bill of materials for one finished product, with the cost recomputed
 * live as quantities change — so "what does this cost to make" is answered
 * while editing rather than after saving.
 */
export function RecipeEditor({
  action,
  materials,
  target,
  disabled
}: {
  action: AdminFormAction;
  materials: RecipeMaterial[];
  target: RecipeTarget;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialAdminActionState);
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(materials.map((material) => [material.id, String(target.quantities[material.id] ?? "")]))
  );

  const priced = materials.map((material) => {
    const parsed = Number.parseFloat(quantities[material.id] ?? "");
    const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    return { material, quantity, lineCost: Math.round(material.costPerUnit * quantity) };
  });

  const used = priced.filter((row) => row.quantity > 0);
  const totalCost = used.reduce((total, row) => total + row.lineCost, 0);
  const ingredientCost = used
    .filter((row) => row.material.kind === "INGREDIENT")
    .reduce((total, row) => total + row.lineCost, 0);
  const packagingCost = used
    .filter((row) => row.material.kind === "PACKAGING")
    .reduce((total, row) => total + row.lineCost, 0);
  const margin = target.price > 0 ? Math.round(((target.price - totalCost) / target.price) * 100) : null;

  const groups = (["INGREDIENT", "PACKAGING", "OTHER"] as const)
    .map((kind) => ({ kind, rows: priced.filter((row) => row.material.kind === kind) }))
    .filter((group) => group.rows.length > 0);

  return (
    <form action={formAction} className="admin-form">
      <fieldset disabled={disabled || pending}>
        <input name="productId" type="hidden" value={target.productId} />
        <input name="variantId" type="hidden" value={target.variantId} />

        {groups.map((group) => (
          <div className="admin-panel-section" key={group.kind}>
            <h3>{KIND_LABEL[group.kind]}</h3>
            <div className="recipe-grid">
              {group.rows.map(({ material, lineCost, quantity }) => (
                <label className="admin-field recipe-field" key={material.id}>
                  <span>
                    {material.name}
                    <small>
                      {formatMoney(material.costPerUnit)} / {material.unit}
                      {quantity > 0 ? ` · ${formatMoney(lineCost)} per unit made` : ""}
                    </small>
                  </span>
                  <input
                    inputMode="decimal"
                    min="0"
                    name={`recipeQuantity.${material.id}`}
                    onChange={(event) =>
                      setQuantities((current) => ({ ...current, [material.id]: event.target.value }))
                    }
                    placeholder={`0 ${material.unit}`}
                    value={quantities[material.id] ?? ""}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="recipe-total">
          <div className="panel-header">
            <h3>Cost to make one</h3>
            <span>{formatMoney(totalCost)}</span>
          </div>
          <p className="admin-help">
            {formatMoney(ingredientCost)} ingredients · {formatMoney(packagingCost)} packaging
            {margin !== null ? ` · sells for ${formatMoney(target.price)}, a ${margin}% margin` : ""}
          </p>
          {used.length === 0 ? (
            <p className="admin-help">
              Nothing set yet. Enter how much of each material one unit uses — leave the rest blank.
            </p>
          ) : null}
        </div>

        {state.message ? <p className={`admin-form-status ${state.status}`}>{state.message}</p> : null}
        <button className="admin-action" type="submit">
          {pending ? "Saving..." : "Save recipe"}
        </button>
      </fieldset>
      {disabled ? <p className="admin-help">Enable Firestore and sign in to edit recipes.</p> : null}
    </form>
  );
}
