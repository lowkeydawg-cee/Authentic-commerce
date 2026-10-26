import { CartDrawer } from "@/components/storefront/CartDrawer";
import { Catalog } from "@/components/storefront/Catalog";
import { CheckoutModal } from "@/components/storefront/CheckoutModal";
import { Footer } from "@/components/storefront/Footer";
import { Hero } from "@/components/storefront/Hero";
import { Navbar } from "@/components/storefront/Navbar";
import { BrandPromise } from "@/components/storefront/BrandPromise";

export default function StorefrontPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Catalog />
        <BrandPromise />
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </>
  );
}
