import { useState } from "react";
import { TRPC_REACT } from "../utils/trpc";
import type { OnlineDevice } from "../utils/firebaseApi";
import { DevicesList } from "./DevicesList";

export default function Devices() {
  const [devices, setDevices] = useState<OnlineDevice[]>([]);

  TRPC_REACT.device.getConnectedDevices.useSubscription(undefined, {
    onData(data) {
      setDevices(data as OnlineDevice[]);
    },
    onError(err) {
      console.log("🚀 ~ onError ~ err:", err);
    },
  });

  const approvedCount = devices.filter((device) => device.approved).length;
  const pendingCount = devices.filter((device) => !device.approved).length;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Device Control
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Live voting stations
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Approve new devices, assign voters, and end active sessions from one live queue.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Online
              </p>
              <p className="mt-1 text-2xl font-bold">{devices.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Approved
              </p>
              <p className="mt-1 text-2xl font-bold">{approvedCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Pending
              </p>
              <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Waiting For Devices
          </p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            No voting stations are online right now
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Once a device opens the app and requests access, it will appear here in real time for approval and voter assignment.
          </p>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Connected Devices
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Approval and assignment queue
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              Device changes appear here as soon as they connect.
            </p>
          </div>
          <ul>
            <DevicesList devices={devices} />
          </ul>
        </div>
      )}
    </div>
  );
}
