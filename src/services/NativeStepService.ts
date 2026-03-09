import { registerPlugin } from "@capacitor/core";

/* 1️⃣ Define plugin interface */
export interface StepPluginType {
  getSteps(): Promise<{ steps: number }>;
  syncReminders(options: {
    notificationsEnabled: boolean;
    reminders: Array<{ id: string; enabled: boolean; time: string }>;
    workoutReminder: { enabled: boolean; time: string };
  }): Promise<{ ok: boolean }>;
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

export const syncNativeReminders = async (
  notificationsEnabled: boolean,
  reminders: Array<{ id: string; enabled: boolean; time: string }>,
  workoutReminder: { enabled: boolean; time: string }
) => {
  try {
    await StepPlugin.syncReminders({
      notificationsEnabled,
      reminders,
      workoutReminder,
    });
  } catch (e) {
    console.warn("Native reminder sync error:", e);
  }
};

