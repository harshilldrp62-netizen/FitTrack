import { Navigate } from "react-router-dom";
import type { User } from "firebase/auth";
import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
  user: User | null;
  authLoading: boolean;
};

const ProtectedRoute = ({ children, user, authLoading }: ProtectedRouteProps) => {
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
