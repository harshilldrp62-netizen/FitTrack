import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { syncNativeReminders } from "@/services/NativeStepService";

interface Reminder {
  id: string;
  label: string;
  enabled: boolean;
  time: string;
}

const Reminders = () => {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: "breakfast", label: "Breakfast", enabled: false, time: "08:00" },
    { id: "lunch", label: "Lunch", enabled: false, time: "12:30" },
    { id: "dinner", label: "Dinner", enabled: false, time: "19:00" },
  ]);
  const [customWorkoutTime, setCustomWorkoutTime] = useState("18:00");
  const [customWorkoutEnabled, setCustomWorkoutEnabled] = useState(false);

  useEffect(() => {
    // Load saved reminders
    const savedReminders = localStorage.getItem("reminders");
    if (savedReminders) {
      const parsed = JSON.parse(savedReminders) as Reminder[];
      setReminders(parsed.filter((item) => item.id !== "water"));
    }

    const savedCustomWorkout = localStorage.getItem("customWorkoutReminder");
    if (savedCustomWorkout) {
      const parsed = JSON.parse(savedCustomWorkout);
      setCustomWorkoutTime(parsed.time);
      setCustomWorkoutEnabled(parsed.enabled);
    }

    // Check notification permission
    const checkPermissions = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const perms = await LocalNotifications.checkPermissions();
          setNotificationsEnabled(perms.display === "granted");
          return;
        }
      } catch {
        // fall back to browser
      }

      if ("Notification" in window) {
        setNotificationsEnabled(Notification.permission === "granted");
      }
    };

    checkPermissions();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await LocalNotifications.requestPermissions();
        const granted = permission.display === "granted";
        setNotificationsEnabled(granted);

        if (granted) {
          await LocalNotifications.createChannel({
            id: "fitness_reminders",
            name: "Fitness Reminders",
            importance: 5,
          });
        }

        toast({
          title: granted ? "Notifications enabled!" : "Notifications blocked",
          description: granted
            ? "You'll receive reminders for enabled items."
            : "Please enable notification permission in device settings.",
          variant: granted ? "default" : "destructive",
        });
        return;
      }
    } catch {
      // fall back to browser
    }

    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setNotificationsEnabled(granted);

      toast({
        title: granted ? "Notifications enabled!" : "Notifications blocked",
        description: granted
          ? "You'll receive reminders for enabled items."
          : "Please enable notifications in your browser settings.",
        variant: granted ? "default" : "destructive",
      });
    }
  };

  const syncNativeSchedules = async (
    nextReminders: Reminder[],
    workoutEnabled: boolean,
    workoutTime: string
  ) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const enabledRaw = localStorage.getItem("notificationsEnabled");
      const notificationsEnabled = enabledRaw === null ? true : enabledRaw === "true";
      await syncNativeReminders(
        notificationsEnabled,
        nextReminders,
        workoutEnabled ? { enabled: true, time: workoutTime } : { enabled: false, time: workoutTime }
      );
    } catch (err) {
      console.warn("Reminder schedule sync failed:", err);
    }
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setReminders(updated);
    localStorage.setItem("reminders", JSON.stringify(updated));

    if (updated.find((r) => r.id === id)?.enabled) {
      toast({
        title: "Reminder enabled",
        description: `You'll be notified at ${updated.find((r) => r.id === id)?.time}`,
      });
    }
  };

  const updateReminderTime = (id: string, time: string) => {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, time } : r
    );
    setReminders(updated);
    localStorage.setItem("reminders", JSON.stringify(updated));
  };

  const toggleCustomWorkout = () => {
    const newState = !customWorkoutEnabled;
    setCustomWorkoutEnabled(newState);
    localStorage.setItem(
      "customWorkoutReminder",
      JSON.stringify({ time: customWorkoutTime, enabled: newState })
    );

    if (newState) {
      toast({
        title: "Workout reminder enabled",
        description: `You'll be notified at ${customWorkoutTime}`,
      });
    }
  };

  const activeReminders = [
    ...reminders.filter((r) => r.enabled),
    ...(customWorkoutEnabled
      ? [{ id: "custom-workout", label: "Workout", time: customWorkoutTime }]
      : []),
  ];

  useEffect(() => {
    syncNativeSchedules(reminders, customWorkoutEnabled, customWorkoutTime);
  }, [reminders, customWorkoutEnabled, customWorkoutTime]);

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header">
        <div className="flex items-center gap-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="mobile-title text-foreground">
              Reminders
            </h1>
            <p className="text-sm text-muted-foreground">Stay on track</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Enable Notifications */}
        {!notificationsEnabled && (
          <div className="bg-card rounded-2xl p-4 border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-1">Enable Notifications</p>
                <p className="text-base text-muted-foreground">
                  Allow notifications to receive reminders
                </p>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        )}

        {/* Preset Reminders */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Meal Reminders</h2>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-card rounded-2xl p-5 shadow-sm border flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{reminder.label}</p>
                    <input
                      type="time"
                      value={reminder.time}
                      onChange={(e) =>
                        updateReminderTime(reminder.id, e.target.value)
                      }
                      className="text-base text-muted-foreground bg-transparent border-none outline-none mt-1"
                      disabled={!reminder.enabled}
                    />
                  </div>
                </div>
                <Switch
                  checked={reminder.enabled}
                  onCheckedChange={() => toggleReminder(reminder.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom Workout Reminder */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Workout Reminder</h2>
          <div className="bg-card rounded-2xl p-5 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Custom Workout Time</p>
                  <p className="text-base text-muted-foreground">
                    Set your preferred workout time
                  </p>
                </div>
              </div>
              <Switch
                checked={customWorkoutEnabled}
                onCheckedChange={toggleCustomWorkout}
              />
            </div>
            {customWorkoutEnabled && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <input
                  type="time"
                  value={customWorkoutTime}
                  onChange={(e) => {
                    setCustomWorkoutTime(e.target.value);
                    localStorage.setItem(
                      "customWorkoutReminder",
                      JSON.stringify({
                        time: e.target.value,
                        enabled: customWorkoutEnabled,
                      })
                    );
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* Active Reminders List */}
        {activeReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Active Reminders</h2>
            <div className="space-y-2">
              {activeReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-primary/10 rounded-2xl p-5 shadow-sm border border-primary/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{reminder.label}</p>
                      <p className="text-base text-muted-foreground">
                        {reminder.time}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Reminders;
