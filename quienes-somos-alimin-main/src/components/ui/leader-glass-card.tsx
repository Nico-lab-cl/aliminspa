"use client";

import { motion } from "framer-motion";
import { GlowCard } from "./spotlight-card";

interface LeaderGlassCardProps {
  name: string;
  role: string;
  description: string;
  image: string;
  className?: string;
}

export function LeaderGlassCard({
  name,
  role,
  description,
  image,
  className,
}: LeaderGlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      <GlowCard glowColor="green" customSize className="w-full h-full">
        <div className="relative z-10 mx-auto w-full overflow-visible rounded-[24px] bg-white/95 backdrop-blur-xl border border-alimin-gold/15 shadow-[0_8px_32px_-8px_rgba(26,46,38,0.12)] hover:shadow-[0_12px_40px_-8px_rgba(201,168,76,0.2)] transition-all duration-500 hover:-translate-y-1">
          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-alimin-gold/50 to-transparent rounded-t-[24px]" />

          <div className="p-8 sm:p-10">
            {/* Photo and Info */}
            <div className="flex flex-col items-center text-center">
              {/* Photo */}
              <div className="relative mb-6">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-[3px] ring-alimin-gold/30 shadow-lg">
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover object-[center_20%] scale-110"
                    loading="lazy"
                  />
                </div>
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-full ring-1 ring-alimin-gold/20 scale-110" />
              </div>

              {/* Name and Role */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-alimin-green-deep">
                  {name}
                </h3>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-alimin-gold/15 text-alimin-gold">
                  {role}
                </span>
              </div>

              {/* Description */}
              <p className="text-alimin-green/70 text-sm sm:text-[15px] leading-relaxed max-w-xs">
                {description}
              </p>
            </div>
          </div>

          {/* Bottom subtle gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/20 to-transparent rounded-b-[24px] pointer-events-none" />
        </div>
      </GlowCard>
    </motion.div>
  );
}
