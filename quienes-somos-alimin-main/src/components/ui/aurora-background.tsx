"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main className="relative min-h-screen bg-alimin-cream">
      <div
        className={cn(
          "relative flex flex-col min-h-screen items-center transition-bg",
          className
        )}
        {...props}
      >
        {/* Subtle aurora effect - very light */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn(
              `
            [background-image:repeating-linear-gradient(100deg,rgba(59,130,246,0.15)_10%,rgba(99,102,241,0.15)_15%,rgba(147,197,253,0.15)_20%,rgba(167,139,250,0.15)_25%,rgba(96,165,250,0.15)_30%)]
            [background-size:200%,_100%]
            [background-position:50%_50%]
            after:absolute after:inset-0 
            after:[background-image:repeating-linear-gradient(100deg,rgba(59,130,246,0.15)_10%,rgba(99,102,241,0.15)_15%,rgba(147,197,253,0.15)_20%,rgba(167,139,250,0.15)_25%,rgba(96,165,250,0.15)_30%)] 
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed]
            absolute -inset-[10px] opacity-60 will-change-transform`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_5%,transparent_60%)]` 
            )}
          />
        </div>
        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    </main>
  );
};
