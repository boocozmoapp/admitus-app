import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  markClassName?: string;
  textClassName?: string;
  taglineClassName?: string;
  className?: string;
  tone?: "brand" | "dark";
};

export function AdmitusMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-9 shrink-0", className)}
      aria-hidden="true"
    >
      <rect x="0" y="10" width="11" height="42" fill="#AAD8D8" />
      <rect x="0" y="10" width="44" height="11" fill="#AAD8D8" />
      <rect x="33" y="10" width="11" height="20" fill="#AAD8D8" />
      <rect x="11" y="21" width="24" height="31" fill="#022226" />
      <polygon points="28,21 37,25 37,52 28,52" fill="#1A4040" />
      <rect x="27" y="21" width="2" height="31" fill="#F7E28B" opacity="0.85" />
      <circle cx="23" cy="37" r="2.5" fill="#AAD8D8" />
    </svg>
  );
}

export function BrandLogo({
  compact = false,
  markClassName,
  textClassName,
  taglineClassName,
  className,
  tone = "brand",
}: BrandLogoProps) {
  const admitClassName = tone === "dark" ? "text-[#022226]" : "text-[#F7E28B]";
  const usClassName = tone === "dark" ? "text-[#1A4040]" : "text-[#AAD8D8]";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <AdmitusMark className={markClassName} />
      {!compact && (
        <div className="leading-none">
          <div className={cn("font-heading text-xl font-extrabold tracking-tight", textClassName)}>
            <span className={admitClassName}>Admit</span>
            <span className={usClassName}>Us</span>
          </div>
          <div className={cn("mt-1 text-[10px] italic tracking-[0.03em] text-[#6A9A9A]", taglineClassName)}>
            your way in.
          </div>
        </div>
      )}
    </div>
  );
}
