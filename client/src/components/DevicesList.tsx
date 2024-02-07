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
    <li
      key={device.id}
      className="mb-6 flex flex-row items-center border-b border-gray-200 pb-10"
    >
      {device.id}. {device.name}
      {isAssigned && ` Being used by voter ${device.voterId}`}
      {!isAssigned && (
        <>
          <input
            name="voterId"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            placeholder="voter id"
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline max-w-50 mx-5"
          />
          <button
            type="button"
            onClick={onAssignVoter}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
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
