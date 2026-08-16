const products = [
  ["OMK Intimate Oil", "Variant required"],
  ["Slippery Elm", "30 Capsules"],
  ["Infection Flusher", "Pouch"]
];

export default function PosPage() {
  return (
    <>
      <main className="pos-products">
        <h1 className="app-title">POS sale</h1>
        <p className="app-subtitle">
          Open a shift, search products, and build the customer&apos;s cart.
        </p>
        <label>
          <span className="scene-kicker">Product search</span>
          <input className="search-box" placeholder="Search product, SKU, or barcode" />
        </label>
        <section className="product-grid" aria-label="POS product shortcuts">
          {products.map(([name, detail]) => (
            <article className="pos-product" key={name}>
              <strong>{name}</strong>
              <span>{detail}</span>
            </article>
          ))}
        </section>
      </main>
      <aside className="pos-cart" aria-label="POS cart">
        <h2 className="app-title">Cart</h2>
        <div className="cart-line">
          <strong>No items</strong>
          <span>Scan or tap products to begin.</span>
        </div>
        <button className="checkout-button" type="button">
          Complete sale
        </button>
      </aside>
    </>
  );
}
