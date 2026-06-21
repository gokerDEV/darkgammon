import type { Color } from "./games/backgammon/types";

export type PlayerSide = "light" | "dark";

export function oppositeSide(side: PlayerSide): PlayerSide {
  return side === "light" ? "dark" : "light";
}

export function sideToColor(side: PlayerSide): Color {
  return side === "light" ? "white" : "black";
}

export function colorToSide(color: Color): PlayerSide {
  return color === "white" ? "light" : "dark";
}
