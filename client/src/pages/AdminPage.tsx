import { useNavigate } from "react-router-dom";
import { logout } from "../store/features/authSlice";
import { useAppDispatch } from "../store/store";
import { TRPC_REACT } from "../utils/trpc";
import { useState } from "react";
import { OnlineDeviceType } from "../../../server";
import { DevicesList } from "../components/DevicesList";

export function AdminPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [devices, setDevices] = useState<OnlineDeviceType[]>([]);

  TRPC_REACT.device.getConnectedDevices.useSubscription(undefined, {
    onData(data) {
      console.log("🚀 ~ onData ~ data:", data);
      setDevices(data as unknown as OnlineDeviceType[]);
    },
    onError(err) {
      console.log("🚀 ~ onError ~ err:", err);
    },
  });
  const onLogout = () => {
    dispatch(logout());
    navigate("/");
  };
  return (
    <div className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome back
          </h1>
          <button
            type="button"
            onClick={onLogout}
            className="bg-red-400 hover:bg-red-600 text-black font-bold py-2 px-4 rounded mr-4"
          >
            logout
          </button>
        </div>
        {devices.length === 0 && (
          <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 text-center">
            no devices online
          </p>
        )}
        {devices.length > 0 && (
          <>
            <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 text-center">
              list of devices online
            </p>
            <ul>
              <DevicesList devices={devices} />
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
