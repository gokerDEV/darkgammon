"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerSide } from "@/lib/side";
import { cn } from "@/lib/utils";

export function SideSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: PlayerSide;
  onChange: (side: PlayerSide) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-center p-1 bg-muted rounded-xl overflow-hidden">
      <Button
        variant="ghost"
        type="button"
        disabled={disabled}
        onClick={() => onChange("light")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 rounded-lg py-6 transition-all",
          value === "light"
            ? "bg-background text-foreground hover:bg-background hover:text-foreground font-bold shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50 font-medium",
        )}
      >
        <Sun size={18} />
        LIGHT
      </Button>
      <Button
        variant="ghost"
        type="button"
        disabled={disabled}
        onClick={() => onChange("dark")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 rounded-lg py-6 transition-all",
          value === "dark"
            ? "bg-background text-foreground hover:bg-background hover:text-foreground font-bold shadow-sm ring-1 ring-border"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50 font-medium",
        )}
      >
        <Moon size={18} />
        DARK
      </Button>
    </div>
  );
}
