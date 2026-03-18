import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/store";

interface PrivateRouteProps {
  children: React.ReactNode;
  role: "staff" | "device" | undefined;
}

export function PrivateRoute({ children, role }: PrivateRouteProps) {
  const { type, device, staff } = useAppSelector((s) => s.auth);
  if (!type) {
    return <Navigate to={"/"} />;
  }
  if (role === "device" && !device) {
    return <Navigate to={"/"} />;
  }
  if (role === "staff" && !staff) {
    return <Navigate to={"/"} />;
  }
  return children;
}
