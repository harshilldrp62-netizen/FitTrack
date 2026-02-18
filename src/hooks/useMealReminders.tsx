import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Meal = { key: string; label: string; hour: number; minute?: number };

const defaultMeals: Meal[] = [
  { key: "breakfast", label: "Breakfast", hour: 8, minute: 0 },
  { key: "lunch", label: "Lunch", hour: 13, minute: 0 },
  { key: "snack", label: "Snack", hour: 16, minute: 0 },
  { key: "dinner", label: "Dinner", hour: 19, minute: 0 },
];

const msUntilNext = (hour: number, minute = 0) => {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
};

// Hook: attempt to schedule native local notifications via Capacitor if available.
// Fallback: use the browser Notification API and in-app toast checks while app is open.
export const useMealReminders = (meals: Meal[] = defaultMeals) => {
  const { toast } = useToast();

  useEffect(() => {
    let timers: number[] = [];

    const checkAndNotify = (meal: Meal) => {
      const today = new Date().toDateString();
      try {
        const saved = localStorage.getItem(`meals_${today}`);
        const mealsObj = saved ? JSON.parse(saved) : {};
        const logged = mealsObj[meal.key];
        if (!logged || !logged.foods || logged.foods.length === 0) {
          // Browser Notification if permission granted
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`${meal.label} reminder`, {
              body: `You haven't logged your ${meal.label.toLowerCase()} yet. Tap to open the app and log it.`,
            });
          }

          // In-app toast as a fallback (when app is open)
          toast({ title: `${meal.label} reminder`, description: `You haven't logged your ${meal.label.toLowerCase()} yet.` });
        }
      } catch (err) {
        console.warn("Meal reminder check failed:", err);
      }
    };

    const scheduleBrowserFallback = async () => {
      // Request Notification permission for browser
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
        try {
          await Notification.requestPermission();
        } catch (e) {
          // ignore
        }
      }

      // Set timeouts for each meal for the current/next occurrence
      meals.forEach((meal) => {
        const ms = msUntilNext(meal.hour, meal.minute ?? 0);
        const id = window.setTimeout(() => {
          checkAndNotify(meal);
          // After firing once, set an interval to fire every 24h
          const intervalId = window.setInterval(() => checkAndNotify(meal), 24 * 60 * 60 * 1000);
          timers.push(intervalId as unknown as number);
        }, ms);
        timers.push(id as unknown as number);
      });
    };

    const tryNativeSchedule = async () => {
      // Attempt dynamic import of Capacitor Local Notifications plugin
      try {
        // @ts-ignore - dynamic import
        const cap = (window as any).Capacitor;
        if (!cap) throw new Error("Capacitor not detected");

        const mod = await import("@capacitor/local-notifications");
        const LocalNotifications = (mod as any).LocalNotifications;

        // Request permission
        try {
          await LocalNotifications.requestPermissions();
        } catch (permErr) {
          console.warn("LocalNotifications permission request failed:", permErr);
        }

        // Build notifications list
        const notifications = meals.map((meal, idx) => {
          const now = new Date();
          const target = new Date(now);
          target.setHours(meal.hour, meal.minute ?? 0, 0, 0);
          if (target <= now) target.setDate(target.getDate() + 1);

          return {
            id: 1000 + idx,
            title: `${meal.label} reminder`,
            body: `Don't forget to log your ${meal.label.toLowerCase()}!`,
            // schedule may vary between plugin versions; use 'at' when available
            schedule: { at: target, repeats: true },
          };
        });

        // Try scheduling; plugin implementations differ, so wrap in try/catch
        try {
          await LocalNotifications.schedule({ notifications });
        } catch (schErr) {
          console.warn("LocalNotifications.schedule failed, falling back:", schErr);
          // Fallback to browser scheduling while app is open
          scheduleBrowserFallback();
        }
      } catch (err) {
        // Not running in a Capacitor native environment or plugin missing — use browser fallback
        scheduleBrowserFallback();
      }
    };

    tryNativeSchedule();

    return () => {
      // Clear timers from browser fallback
      timers.forEach((t) => clearTimeout(t));
      timers = [];
    };
  }, [meals, toast]);
};

export default useMealReminders;
