import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

type FeatureButtonProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  delay: number;
  animationClass: string;
};

export function FeatureButton({
  title,
  subtitle,
  icon: Icon,
  delay,
  animationClass,
}: FeatureButtonProps) {
  return (
    <button
      className={`group relative w-full overflow-hidden rounded-2xl border-2 border-blue-200/60 bg-white/95 p-5 font-sans shadow-blue-500/20 shadow-lg ring-1 ring-blue-100/50 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-blue-500/30 hover:shadow-xl active:scale-[1.02] active:border-blue-400 active:bg-blue-50/80 active:shadow-2xl active:shadow-blue-500/40 md:p-6 ${animationClass} animate-fade-in`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
      type="button"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60" />

      <div className="relative flex items-center gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 animate-pulse-subtle items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/50 shadow-lg transition-all duration-300 group-active:scale-110 group-active:shadow-blue-500/70 group-active:shadow-xl md:h-16 md:w-16">
          <Icon className="h-7 w-7 text-white md:h-8 md:w-8" />
        </div>

        <div className="flex-1 space-y-1 text-left">
          <h3 className="font-orbitron font-semibold text-gray-900 text-lg md:text-xl">
            {title}
          </h3>
          <p className="font-sans text-gray-600 text-sm leading-snug md:text-base">
            {subtitle}
          </p>
        </div>

        <ChevronRight className="h-6 w-6 flex-shrink-0 text-blue-500 transition-all duration-300 group-active:translate-x-1 group-active:text-blue-600 md:h-7 md:w-7" />
      </div>
    </button>
  );
}
