import { useState } from "react";
import { OnlineDeviceType } from "../../../server";
import { TRPC_REACT } from "../utils/trpc";

function DeviceListItem({ device }: { device: OnlineDeviceType }) {
  const [voterId, setVoterId] = useState("");
  const isAssigned = !!device.voterId;

  const assignMutation = TRPC_REACT.device.assignVoter.useMutation({
    onError(error) {
      console.log("🚀 ~ onError ~ error:", error);
    },
    onSuccess(data) {
      console.log("🚀 ~ onSuccess ~ data:", data);
    },
    onSettled() {
      setVoterId("");
    },
  });

  const onAssignVoter = () => {
    assignMutation.mutate({
      name: device.name,
      voterId: Number(voterId),
    });
  };
  return (
    <li key={device.id} className="mb-6">
      #{device.id} {device.name}
      {isAssigned && ` Being used by voter ${device.voterId}`}
      {!isAssigned && (
        <>
          <input
            name="voterId"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            placeholder="voter id"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button type="button" onClick={onAssignVoter}>
            Assign
          </button>
        </>
      )}
    </li>
  );
}

export function DevicesList({ devices }: { devices: OnlineDeviceType[] }) {
  return (
    <div>
      {devices?.map((d) => (
        <DeviceListItem device={d} key={d.id} />
      ))}
    </div>
  );
}
