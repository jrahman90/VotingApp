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
        <div
          className="mx-auto max-w-7xl px-6 lg:px-8 flex-row justify-between border-b border-gray-200 pb-10"
          style={{ display: "flex" }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome back
          </h1>
          <button
            type="button"
            onClick={onLogout}
            className="bg-red-400 hover:bg-red-600 text-black font-bold py-2 px-4 rounded mr-4"
          >
            Logout
          </button>
        </div>
        {devices.length === 0 && (
          <p className="my-5 line-clamp-3 text-lg leading-6 text-gray-600 text-left">
            No devices online
          </p>
        )}
        {devices.length > 0 && (
          <>
            <p className="my-5 line-clamp-3 text-lg leading-6 text-gray-600 text-left">
              List of devices online
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
