import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children }: any) => {
  const [status, setStatus] = useState<"loading" | "login" | "onboarding" | "ok">("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
          setStatus("onboarding");
          return;
        }

        const data = snap.data();

        if (!data.profileCompleted) {
          setStatus("onboarding");
          return;
        }

        setStatus("ok");
      } catch (e) {
        console.error("Profile check failed:", e);
        setStatus("login");
      }
    });

    return () => unsubscribe();
  }, []);

  // loading screen
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // redirect cases
  if (status === "login") return <Navigate to="/login" replace />;
  if (status === "onboarding") return <Navigate to="/onboarding" replace />;

  return children;
};

export default ProtectedRoute;
