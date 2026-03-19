import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/store";

interface PrivateRouteProps {
  children: React.ReactNode;
  role: "admin" | "operator" | "device" | undefined;
}

export function PrivateRoute({ children, role }: PrivateRouteProps) {
  const { type, device, staff } = useAppSelector((s) => s.auth);
  if (!type) {
    return <Navigate to={"/"} />;
  }
  if (role === "device" && !device) {
    return <Navigate to={"/"} />;
  }
  if (role === "admin" && (!staff || type !== "admin")) {
    return <Navigate to={"/"} />;
  }
  if (role === "operator" && (!staff || type !== "operator")) {
    return <Navigate to={"/"} />;
  }
  return children;
}
