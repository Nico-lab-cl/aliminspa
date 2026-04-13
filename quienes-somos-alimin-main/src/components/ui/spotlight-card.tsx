"use client";

import React, { useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "purple" | "green" | "red" | "orange";
  size?: "sm" | "md" | "lg";
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const sizeMap = {
  sm: "w-48 h-64",
  md: "w-64 h-80",
  lg: "w-80 h-96",
};

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  glowColor = "green",
  size = "md",
  width,
  height,
  customSize = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;

      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const localX = x - rect.left;
        const localY = y - rect.top;

        cardRef.current.style.setProperty("--x", localX.toFixed(2));
        cardRef.current.style.setProperty("--y", localY.toFixed(2));
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener("pointermove", syncPointer);
      return () => card.removeEventListener("pointermove", syncPointer);
    }
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) {
      return "";
    }
    return sizeMap[size];
  };

  return (
    <div
      ref={cardRef}
      data-glow
      style={
        {
          "--x": "50",
          "--y": "50",
          "--base": base,
          "--spread": spread,
          "--radius": "24",
          "--border": "3",
          "--backdrop": "hsl(0 0% 100% / 0.9)",
          "--backup-border": "rgba(201, 168, 76, 0.3)",
          "--size": "200",
          "--outer": "1",
          "--border-size": "calc(var(--border, 2) * 1px)",
          "--spotlight-size": "calc(var(--size, 150) * 1px)",
          "--hue": `calc(var(--base) + (var(--x, 50) / 100 * var(--spread, 0)))`,
          "--saturation": "100",
          "--lightness": "50",
          "--bg-spot-opacity": "0.35",
          backgroundImage: `radial-gradient(
            var(--spotlight-size) var(--spotlight-size) at
            calc(var(--x, 50) * 1px)
            calc(var(--y, 50) * 1px),
            hsl(var(--hue, 120) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 60) * 1%) / var(--bg-spot-opacity, 0.35)), transparent
          )`,
          backgroundColor: "var(--backdrop, rgba(255,255,255,0.9))",
          backgroundSize:
            "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
          backgroundPosition: "50% 50%",
          border: "var(--border-size) solid var(--backup-border)",
          position: "relative" as const,
          touchAction: "none" as const,
          width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
          height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
        } as React.CSSProperties
      }
      className={cn(
        getSizeClasses(),
        "rounded-3xl",
        "relative",
        "overflow-hidden",
        "backdrop-blur-xl",
        "shadow-[0_8px_32px_-8px_rgba(26,46,38,0.12)]",
        "hover:shadow-[0_12px_40px_-8px_rgba(201,168,76,0.25)]",
        "transition-shadow duration-500",
        className
      )}
    >
      {/* Glow border effect */}
      <div
        data-glow-border
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={
          {
            background: `radial-gradient(
              calc(var(--spotlight-size) * 0.9) calc(var(--spotlight-size) * 0.9) at
              calc(var(--x, 50) * 1px)
              calc(var(--y, 50) * 1px),
              hsl(var(--hue, 120) 100% 60% / 0.8), 
              transparent 100%
            )`,
            mask: "linear-gradient(transparent, transparent), linear-gradient(white, white)",
            maskClip: "padding-box, border-box",
            maskComposite: "intersect",
            border: "var(--border-size) solid transparent",
            borderRadius: "calc(var(--radius) * 1px)",
            willChange: "background",
          } as React.CSSProperties
        }
      />

      {/* Inner glow */}
      <div
        data-glow-inner
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-70"
        style={
          {
            background: `radial-gradient(
              calc(var(--spotlight-size) * 0.6) calc(var(--spotlight-size) * 0.6) at
              calc(var(--x, 50) * 1px)
              calc(var(--y, 50) * 1px),
              hsl(var(--hue, 120) 100% 70% / 0.4), 
              transparent 100%
            )`,
            willChange: "background",
          } as React.CSSProperties
        }
      />

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

export { GlowCard };
