import type { InputState } from "./types";

export function createInput() {
  const input: InputState = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    dash: false,
    defend: false
  };

  const held = { shoot: false, dash: false };

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "a" || k === "arrowleft") input.left = true;
    if (k === "d" || k === "arrowright") input.right = true;
    if (k === "w" || k === "arrowup" || e.key === " ") input.jump = true;
    if (e.code === "KeyC") input.defend = true;


    if (k === "q" && !held.shoot) {
      input.shoot = true;      // edge-triggered
      held.shoot = true;
    }
    if (k === "shift" && !held.dash) {
      input.dash = true;       // edge-triggered
      held.dash = true;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "a" || k === "arrowleft") input.left = false;
    if (k === "d" || k === "arrowright") input.right = false;
    if (k === "w" || k === "arrowup" || e.key === " ") input.jump = false;

    if (k === "q") held.shoot = false;
    if (k === "shift") held.dash = false;
    if (e.code === "KeyC") input.defend = false;

  };

  const resetFrameInputs = () => {
    input.shoot = false;
    input.dash = false;
  };

  return { input, onKeyDown, onKeyUp, resetFrameInputs };
}
