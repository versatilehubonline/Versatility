import { HeroSection } from "@/components/hero-section";
import { FeaturedProducts } from "@/components/featured-products";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between overflow-hidden relative bg-[#050505]">
      <HeroSection />
      <FeaturedProducts />
    </main>
  );
}
