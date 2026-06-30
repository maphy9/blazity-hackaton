"use client";

import { Check } from "lucide-react";

import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

interface PlatformSelectorProps {
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export function PlatformSelector({
  selected,
  onToggle,
  disabled,
}: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Platforms</p>
      <div className="grid grid-cols-2 gap-2.5">
        {PLATFORMS.map((platform) => {
          const isSelected = selected.includes(platform.id);
          return (
            <button
              key={platform.id}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onToggle(platform.id, !isSelected)}
              style={
                isSelected
                  ? { borderColor: platform.accent, boxShadow: `0 0 0 1px ${platform.accent}` }
                  : undefined
              }
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                "hover:border-foreground/30 disabled:opacity-50",
                isSelected ? "bg-card" : "bg-card/40 border-border",
              )}
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: platform.accent }}
              >
                {platform.icon}
              </span>
              <span className="text-sm font-medium">{platform.label}</span>
              {isSelected && (
                <Check
                  className="ml-auto size-4"
                  style={{ color: platform.accent }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
