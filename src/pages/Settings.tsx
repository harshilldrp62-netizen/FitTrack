import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Bell, Scale, FileText, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(true);
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    // Load saved settings
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    const savedNotifications = localStorage.getItem("notificationsEnabled");
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === "true");
    }

    const savedUnit = localStorage.getItem("unitPreference");
    if (savedUnit) {
      setUnit(savedUnit as "kg" | "lbs");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme} mode`,
    });
  };

  const toggleNotifications = () => {
    const newState = !notifications;
    setNotifications(newState);
    localStorage.setItem("notificationsEnabled", newState.toString());
  };

  const toggleUnit = () => {
    const newUnit = unit === "kg" ? "lbs" : "kg";
    setUnit(newUnit);
    localStorage.setItem("unitPreference", newUnit);
    toast({
      title: "Unit preference updated",
      description: `Switched to ${newUnit}`,
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would send to backend
    console.log("Feedback submitted:", feedback);
    localStorage.setItem("feedback", feedback);
    setFeedback("");
    toast({
      title: "Thank you!",
      description: "Your feedback has been submitted.",
    });
  };

  return (
    <div className="mobile-page">
      {/* Header */}
      <header className="mobile-header">
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="mobile-title text-foreground">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">Customize your app</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Theme Toggle */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "light" ? (
                <Sun className="w-5 h-5 text-warning" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-base text-muted-foreground">
                  {theme === "light" ? "Light mode" : "Dark mode"}
                </p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-base text-muted-foreground">
                  Enable app notifications
                </p>
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={toggleNotifications}
            />
          </div>
        </div>

        {/* Unit Preferences */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-accent" />
              <div>
                <p className="font-medium">Weight Unit</p>
                <p className="text-base text-muted-foreground">
                  Current: {unit.toUpperCase()}
                </p>
              </div>
            </div>
            <Switch checked={unit === "lbs"} onCheckedChange={toggleUnit} />
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Feedback & Bug Reports</h2>
          </div>
          <Textarea
            placeholder="Share your feedback, report bugs, or suggest features..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px] mb-4"
          />
          <Button onClick={handleSubmitFeedback} className="w-full">
            Submit Feedback
          </Button>
        </div>

        {/* About Section */}
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">About</h2>
          </div>
          <div className="space-y-2 text-base text-muted-foreground">
            <p>FitTrack v1.0.0</p>
            <p>Your personal fitness companion</p>
            <Link
              to="/privacy"
              className="text-primary hover:underline block mt-4"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Settings;
