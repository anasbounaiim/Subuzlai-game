"use client";

import { PlatformerGame } from "../game/PlatformerGame";

export function FlatPlatformer() {
  return <PlatformerGame startLevelId={0} onBack={function (): void {
    throw new Error("Function not implemented.");
  } } />;
}
