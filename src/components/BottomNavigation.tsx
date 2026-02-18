import { Link, useLocation } from "react-router-dom";
import { Home, Utensils, Dumbbell, TrendingUp, User } from "lucide-react";

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/nutrition", icon: Utensils, label: "Nutrition" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="
      fixed bottom-0 left-0 right-0 z-50
      bg-background/95 backdrop-blur
      border-t border-border
      shadow-[0_-4px_16px_rgba(0,0,0,0.08)]
      pb-[env(safe-area-inset-bottom)]
      overflow-hidden
      "
    >
      <div className="max-w-md mx-auto flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="
              flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs
              transition active:scale-95
              "
            >
              <Icon
                className={`w-6 h-6 transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
