import { useState } from "react";
import { TRPC_REACT } from "../utils/trpc";
import type { OnlineDevice } from "../utils/firebaseApi";
import { DevicesList } from "./DevicesList";

export default function Devices() {
  const [devices, setDevices] = useState<OnlineDevice[]>([]);

  TRPC_REACT.device.getConnectedDevices.useSubscription(undefined, {
    onData(data) {
      console.log("🚀 ~ onData ~ data:", data);
      setDevices(data as OnlineDevice[]);
    },
    onError(err) {
      console.log("🚀 ~ onError ~ err:", err);
    },
  });
  return (
    <div>
      {devices.length === 0 && (
        <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
          No devices online
        </p>
      )}
      {devices.length > 0 && (
        <>
          <p className="my-8 line-clamp-3 text-lg leading-6 text-gray-600 text-left">
            List of devices online
          </p>
          <ul>
            <DevicesList devices={devices} />
          </ul>
        </>
      )}
    </div>
  );
}
