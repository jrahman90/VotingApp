import { useNavigate } from "react-router-dom";
import { logout } from "../store/features/authSlice";
import { useAppDispatch } from "../store/store";

export function AdminPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const onLogout = () => {
    dispatch(logout());
    navigate("/admin");
  };
  return (
    <div className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome back
          </h1>
          <button type="button" onClick={onLogout}>
            logout
          </button>
        </div>
      </div>
    </div>
  );
}
