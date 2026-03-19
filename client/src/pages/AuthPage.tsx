import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TRPC_REACT } from "../utils/trpc";
import { useAppDispatch } from "../store/store";
import {
  loginStaff,
  logout,
  registerDevice as registerDeviceAction,
} from "../store/features/authSlice";
import { useAppAlert } from "../utils/alerts";

export function AuthPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deviceName, setDeviceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { showAlert } = useAppAlert();

  const loginMutation = TRPC_REACT.staff.login.useMutation({
    onSuccess(data) {
      console.log("🚀 ~ onSuccess ~ data:", data);
      dispatch(loginStaff({ staff: data }));
      navigate(data.role === "operator" ? "/operator" : "/admin");
    },
    onError(error) {
      showAlert(error.message);
      console.log("🚀 ~ onError ~ error:", error);
    },
  });

  const registerDevice = TRPC_REACT.device.register.useMutation({
    onSuccess(data) {
      console.log("🚀 ~ onSuccess ~ data:", data);
      dispatch(registerDeviceAction({ device: data }));
      navigate("/vote");
    },
    onError(error) {
      showAlert(error.message);
      console.log("🚀 ~ onError ~ error:", error);
    },
  });

  const onRegister = () => {
    if (!deviceName) {
      setErrors([!deviceName ? "device" : ""]);
      return;
    }
    setErrors([]);
    registerDevice.mutate({ name: deviceName });
  };
  const onLogin = () => {
    console.log("🚀 ~ onLogin ~ onLogin:", onLogin);
    if (!email || !password) {
      setErrors([!email ? "email" : "", !password ? "password" : ""]);
      return;
    }
    setErrors([]);
    loginMutation.mutate({ email, password });
  };

  useEffect(() => {
    dispatch(logout());
  }, []);

  useEffect(() => {
    const displayModeStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsAppInstalled(displayModeStandalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
      showAlert("Voting App installed successfully.", "success");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [showAlert]);

  const onInstallApp = async () => {
    if (!installPrompt) {
      showAlert(
        "Install is not available yet in this browser. Open the browser menu and look for Add to Home Screen or Install App.",
        "warning"
      );
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex justify-center">
        <div className="w-full max-w-xs">
          {!isAppInstalled && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Install App
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Install Voting App on this device for a fullscreen, kiosk-style experience.
              </p>
              <button
                type="button"
                onClick={onInstallApp}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Install Voting App
              </button>
            </div>
          )}
          {/* REGISTER DEVICE */}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-5 mt-16">
            Voting device
          </h2>
          <form
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                Device name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="Device name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              {errors.includes("device") && (
                <p className="text-red-500 text-xs italic">
                  Device name is required
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={onRegister}
              >
                Continue
              </button>
            </div>
          </form>

          <p className="text-xl font-bold tracking-tight text-gray-900 sm:text-1xl text-center mb-5 mt-5">
            or
          </p>

          {/* ADMIN USER */}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-5">
            Staff user
          </h2>
          <form
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.includes("email") && (
                <p className="text-red-500 text-xs italic">Email is required</p>
              )}
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="mb-3 rounded border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.includes("password") && (
                <p className="text-red-500 text-xs italic">
                  Password is required
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={onLogin}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
