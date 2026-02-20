import { registerPlugin } from "@capacitor/core";

/* 1️⃣ Define plugin interface */
export interface StepPluginType {
  getSteps(): Promise<{ steps: number }>;
}

/* 2️⃣ Register plugin with type */
const StepPlugin = registerPlugin<StepPluginType>("StepPlugin");

/* 3️⃣ Export helper function */
export const getNativeSteps = async () => {
  try {
    const res = await StepPlugin.getSteps();
    const value = Number(res?.steps ?? 0);
    console.log("[Native] getNativeSteps returned:", value);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch (e) {
    console.log("Native steps error:", e);
    return 0;
  }
};

