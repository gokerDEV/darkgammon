"use client";

import { useEffect } from "react";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";

export function SideProvider({ children }: { children: React.ReactNode }) {
  const { side } = useLocalProfile();

  useEffect(() => {
    console.log("SideProvider applying side:", side);
    document.documentElement.classList.toggle("dark", side === "dark");
  }, [side]);

  return <>{children}</>;
}
