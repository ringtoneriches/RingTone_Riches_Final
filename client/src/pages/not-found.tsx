import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";
import BrandLogo from "@/components/layout/BrandLogo";

export default function NotFound() {
  return (
    <div className="rr-page relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10">
        <Header />
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center">
            <BrandLogo className="mx-auto mb-8 h-12 w-auto object-contain" />
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                404
              </span>
            </div>
            <h1 className="font-prize text-4xl text-white sm:text-5xl">PAGE NOT FOUND</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-white/50">
              That page is not on the board. Head back and pick a live prize.
            </p>
            <Link
              href="/"
              className="rr-cta mt-8 inline-flex items-center justify-center px-8 py-3"
            >
              Back to competitions
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
