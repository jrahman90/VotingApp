import { useState } from "react";
import { TRPC_REACT } from "../utils/trpc";
import type { OnlineDevice } from "../utils/firebaseApi";
import { useAppAlert } from "../utils/alerts";

function DeviceListItem({ device }: { device: OnlineDevice }) {
  const [voterId, setVoterId] = useState("");
  const isAssigned = !!device.voterId;
  const isApproved = device.approved !== false;
  const { showAlert, showConfirmAlert } = useAppAlert();

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
  const killSessionMutation = TRPC_REACT.device.killSession.useMutation({
    onError(error) {
      showAlert(error.message);
    },
    onSuccess() {
      showAlert(`Session closed for ${device.name}.`, "success");
    },
  });
  const approveSessionMutation = TRPC_REACT.device.approveSession.useMutation({
    onError(error) {
      showAlert(error.message);
    },
    onSuccess() {
      showAlert(`Device "${device.name}" approved.`, "success");
    },
  });

  const onAssignVoter = () => {
    if (!voterId) {
      showAlert("Enter a voter id", "warning");
      return;
    }

    assignMutation.mutate({
      name: device.name,
      voterId: Number(voterId),
    });
  };

  const onKillSession = () => {
    showConfirmAlert(`Kill the session for device "${device.name}"?`, [
      {
        label: "Cancel",
        variant: "secondary",
        onClick: () => undefined,
      },
      {
        label: "Kill session",
        variant: "danger",
        onClick: () => killSessionMutation.mutate({ name: device.name }),
      },
    ]);
  };
  return (
    <li
      key={device.id}
      className="mb-6 flex flex-row items-center gap-4 border-b border-gray-200 pb-10"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          {device.id}. {device.name}
        </p>
        {!isApproved && (
          <p className="mt-1 text-sm font-semibold text-amber-700">
            Pending approval
          </p>
        )}
        {isAssigned && (
          <p className="text-sm text-slate-600">
            Being used by voter {device.voterId}
          </p>
        )}
      </div>
      {!isAssigned && (
        <>
          <input
            name="voterId"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            placeholder="voter id"
            type="number"
            disabled={!isApproved}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline max-w-50 mx-5"
          />
          <button
            type="button"
            onClick={onAssignVoter}
            disabled={!isApproved}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Assign
          </button>
        </>
      )}
      {!isApproved && (
        <button
          type="button"
          onClick={() => approveSessionMutation.mutate({ name: device.name })}
          disabled={approveSessionMutation.isLoading}
          className="rounded bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {approveSessionMutation.isLoading ? "Approving..." : "Approve"}
        </button>
      )}
      <button
        type="button"
        onClick={onKillSession}
        className="rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
      >
        Kill session
      </button>
    </li>
  );
}

export function DevicesList({ devices }: { devices: OnlineDevice[] }) {
  return (
    <div>
      {devices?.map((d) => (
        <DeviceListItem device={d} key={d.id} />
      ))}
    </div>
  );
}
