import Image from "next/image";
import Link from "next/link";
import { CartCount } from "@/components/storefront/cart-count";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { BagIcon } from "@/components/storefront/icons";

export function StorefrontNav() {
  return (
    <nav aria-label="Storefront" className="storefront-nav glass">
      <Link className="brand-lockup" href="/">
        <span aria-hidden="true" className="brand-lockup-icon boop">
          <Image
            alt=""
            fill
            priority
            sizes="40px"
            src="/brand/oh-my-kitty-logo.jpeg"
            style={{ objectFit: "cover", transform: "scale(2) translate(-2%, -10%)" }}
          />
        </span>
        <span className="brand-lockup-text">
          <strong>Oh My Kitty</strong>
          <small>intimate care</small>
        </span>
      </Link>

      <CartTrigger ariaLabel="View cart" className="bag-pill icon">
        <BagIcon />
        <CartCount variant="badge" />
      </CartTrigger>
    </nav>
  );
}
