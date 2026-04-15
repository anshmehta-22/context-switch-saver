import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { user } = useAuth();

  if (user === undefined) {
    // Still loading session - render nothing to avoid flash
    return null;
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
