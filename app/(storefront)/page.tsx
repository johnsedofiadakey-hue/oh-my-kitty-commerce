import Image from "next/image";
import Link from "next/link";

export default function StorefrontHomePage() {
  return (
    <>
      <nav className="storefront-nav" aria-label="Storefront">
        <Link className="store-brand" href="/">
          <Image
            src="/brand/oh-my-kitty-logo.jpeg"
            alt="Oh My Kitty logo"
            width={38}
            height={38}
            priority
          />
          <span>Oh My Kitty</span>
        </Link>
        <button className="icon-button" type="button" aria-label="Open menu">
          Menu
        </button>
      </nav>

      <main>
        <section className="hero-scene" aria-labelledby="home-hero-title">
          <div className="hero-frame" aria-hidden="true">
            <div className="product-orbit">
              <div className="product-card left" />
              <div className="product-card primary" />
              <div className="product-card right" />
            </div>
            <div className="hero-copy">
              <h1 id="home-hero-title">Intimate care.</h1>
              <p>Naturally.</p>
            </div>
          </div>
        </section>

        <section className="scene-band">
          <div className="scene-inner">
            <span className="scene-kicker">Soft spatial commerce</span>
            <h2 className="scene-title">Products move first. Words stay light.</h2>
            <Link className="portal-link" href="/shop">
              Shop collection
            </Link>
          </div>
        </section>

        <section className="scene-band black">
          <div className="scene-inner">
            <span className="scene-kicker">Botanical depth</span>
            <h2 className="scene-title">A quiet black scene for stronger contrast.</h2>
          </div>
        </section>
      </main>

      <div className="shop-control" aria-label="Quick shopping controls">
        <Link href="/shop">Shop</Link>
        <span className="dot" aria-hidden="true" />
        <Link href="/cart">Bag 0</Link>
      </div>
    </>
  );
}
