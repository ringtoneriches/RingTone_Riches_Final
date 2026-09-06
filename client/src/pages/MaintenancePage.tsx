import BrandLogo from "@/components/layout/BrandLogo";
import DigitalAtmosphere from "@/components/home/DigitalAtmosphere";

export default function MaintenancePage() {
  return (
    <div className="rr-page fixed inset-0 z-[9999] overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere className="rr-atmosphere--page" />
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <BrandLogo className="mx-auto mb-8 h-14 w-auto object-contain" />
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F1D47A]/35 bg-[#F1D47A]/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F1D47A] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F1D47A]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F1D47A]">
              Scheduled work
            </span>
          </div>
          <h1 className="font-prize text-4xl text-white sm:text-5xl">UNDER MAINTENANCE</h1>
          <p className="mx-auto mt-4 text-base text-white/50">
            We're currently performing scheduled maintenance to improve your experience.
            We'll be back shortly.
          </p>
          <p className="mt-3 text-sm text-white/35">Thank you for your patience!</p>
          <div className="mx-auto mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#C8102E] to-[#F1D47A]" />
          </div>
        </div>
      </div>
    </div>
  );
}
