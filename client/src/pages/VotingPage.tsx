import { useState } from "react";
import { OnlineDeviceType } from "../../../server";
import { CandidatesList } from "../components/CandidatesList";
import { TRPC_REACT } from "../utils/trpc";
import React from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/features/authSlice";
import { useAppAlert } from "../utils/alerts";
import Modal from "react-bootstrap/Modal";

interface VotingDetailed {
  id: number;
  name: string;
  img: string;
  Panels: {
    img: string;
    id: number;
    createdAt: string;
    updatedAt: string;
    Candidates: {
      id: number;
      createdAt: string;
      updatedAt: string;
      panelId: number;
      candidateId: number;
      Candidate: {
        id: number;
        createdAt: string;
        updatedAt: string;
        name: string;
        img: string;
        position: string;
      };
    }[];
    panelName: string;
    panelColor: string;
    textColor: string;
    votingId: number | null;
  }[];
}

interface AssignedVoterDetails {
  voterId: number;
  firstAndMiddleName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  phone: string;
  yob: number;
  permanentAddress: string;
  comments?: string | null;
}

export function VotingPage() {
  const { device } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showAlert } = useAppAlert();

  const { data, isError, isLoading } =
    TRPC_REACT.voting.getOneDetailed.useQuery();
  const votingData = data as VotingDetailed | undefined;

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

  const voterId = devices.find((d) => d.name === device?.name)?.voterId;
  const { data: voterDetails } = TRPC_REACT.voter.getById.useQuery(
    { voterId: voterId as number },
    {
      enabled: !!voterId,
    }
  );
  const assignedVoter = voterDetails as AssignedVoterDetails | undefined;

  const voteMutation = TRPC_REACT.vote.vote.useMutation({
    onError(error) {
      console.log("🚀  vote ~ onError ~ error:", error);
      showAlert(error.message);
    },
    onSuccess(data) {
      console.log("🚀 ~ vote onSuccess ~ data:", data);
      showAlert("Vote submitted successfully.", "success");
      onClear();
    },
  });

  const logoutMutation = TRPC_REACT.device.unregister.useMutation({
    onError(error) {
      console.log("🚀 ~ logoutMutation onError ~ error:", error);
    },
    onSuccess(data) {
      console.log("🚀 ~ logoutMutation onSuccess ~ data:", data);
      dispatch(logout());
      navigate("/");
    },
  });

  const [selection, setSelection] = useState<Record<string, number>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isEnabled = !!voterId;

  const positionOrder = Array.from(
    new Set(
      (votingData?.Panels || []).flatMap((panel) =>
        panel.Candidates.map((candidateLink) => candidateLink.Candidate.position)
      )
    )
  ).sort((left, right) => left.localeCompare(right));

  const selectedCandidates = positionOrder.map((position) => {
    const candidate = votingData?.Panels.flatMap((panel) =>
      panel.Candidates.map((candidateLink) => ({
        ...candidateLink.Candidate,
        panelName: panel.panelName,
      }))
    ).find((candidate) => candidate.id === selection[position]);

    return {
      position,
      label: position,
      candidate,
    };
  });

  const onLogout = () => {
    logoutMutation.mutate({
      name: device?.name as string,
    });
  };

  const onVote = () => {
    if (positionOrder.some((position) => !selection[position])) {
      showAlert("You must select one candidate for all the positions", "warning");
      return;
    }

    setShowConfirmModal(true);
  };

  const onConfirmVote = () => {
    if (!votingData || !voterId || !device?.id) {
      showAlert("Voting session is not ready yet.", "warning");
      return;
    }

    console.log("🚀 ~ VotingPage ~ selection:", selection);
    voteMutation.mutate({
      deviceId: device.id,
      voterId,
      votingId: votingData.id,
      selections: positionOrder.map((position) => ({
        position,
        candidateId: selection[position],
      })),
    });
  };
  const onClear = () => {
    setSelection({});
    setShowConfirmModal(false);
  };
  const onSelection = (id: number, position: string) => {
    setSelection({ ...selection, [position]: id });
  };

  return (
    <div
      className="h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: votingData?.img
          ? `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.82)), url("${votingData.img}")`
          : undefined,
        backgroundColor: "#0f172a",
      }}
    >
      {isLoading && (
        <p className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-slate-200">
          loading...
        </p>
      )}
      {isError && (
        <p className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-slate-200">
          error while fetching the data
        </p>
      )}
      {!isError && !isLoading && (
        <div className="mx-auto flex h-full max-w-[1400px] flex-col px-3 py-3 md:px-4 md:py-4">
          {!data && (
            <div className="mx-auto my-auto max-w-2xl rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur">
              <p className="tracking-tight text-slate-900 text-center">
                No active voting is configured yet. Ask an admin to create one.
              </p>
            </div>
          )}
          {data && (
            <div className="flex h-full flex-col gap-3">
              <div className="rounded-[2rem] bg-white/88 p-4 shadow-2xl backdrop-blur md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-4xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Active Election
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                      {votingData?.name}
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm hover:bg-red-100"
                  >
                    Close Session
                  </button>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-[0.8fr_2fr]">
                  <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      Device
                    </p>
                    <p className="mt-1 text-lg font-semibold">{device?.name}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-300">
                      Voter Number
                    </p>
                    <p className="mt-1 text-xl font-bold">{voterId ?? "Not assigned"}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-lg">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Voter Details
                    </p>
                    {assignedVoter ? (
                      <div className="mt-2 grid gap-x-4 gap-y-1 text-sm text-slate-700 md:grid-cols-2">
                        <p>
                          <b>Name:</b> {assignedVoter.firstAndMiddleName}{" "}
                          {assignedVoter.lastName}
                        </p>
                        <p>
                          <b>Phone:</b> {assignedVoter.phone}
                        </p>
                        <p className="md:col-span-2">
                          <b>Address:</b> {assignedVoter.streetAddress},{" "}
                          {assignedVoter.city}, {assignedVoter.state}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">
                        Assign a voter from the admin screen to unlock this
                        ballot.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {!isEnabled && (
                <div className="flex flex-1 items-center justify-center">
                  <div className="mx-auto max-w-3xl rounded-3xl bg-white/90 p-8 text-center shadow-2xl backdrop-blur">
                    <p className="tracking-tight text-slate-900">
                      Device not enabled. Please identify with your voter number
                    </p>
                  </div>
                </div>
              )}
              {isEnabled && (
                <React.Fragment>
                  <div className="min-h-0 flex-1 rounded-[2rem] bg-white/82 p-3 shadow-2xl backdrop-blur md:p-4">
                    <CandidatesList
                      panels={votingData?.Panels || []}
                      selection={selection}
                      setSelection={onSelection}
                    />
                  </div>
                  <div className="flex justify-center">
                    <div className="flex items-center gap-3 rounded-[1.75rem] bg-slate-950/90 px-5 py-4 shadow-2xl backdrop-blur">
                      <button
                        className="min-w-[160px] rounded-xl bg-slate-200 px-5 py-3 text-lg font-bold text-black hover:bg-slate-300"
                        onClick={onClear}
                      >
                        Clear Selections
                      </button>
                      <button
                        className="min-w-[220px] rounded-xl bg-blue-600 px-6 py-3 text-lg font-bold text-white hover:bg-blue-700"
                        onClick={onVote}
                      >
                        Review And Vote
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          )}
        </div>
      )}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Your Vote</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-4 text-sm text-slate-600">
            Please review your selections carefully before submitting.
          </p>
          <div className="space-y-3">
            {selectedCandidates.map(({ position, label, candidate }) => (
              <div
                key={position}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {candidate?.name || "Not selected"}
                </p>
                {candidate?.panelName && (
                  <p className="text-sm text-slate-600">
                    Panel: {candidate.panelName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={() => setShowConfirmModal(false)}
            className="rounded-xl bg-slate-200 px-4 py-2 font-semibold text-slate-900"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirmVote}
            disabled={voteMutation.isLoading}
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {voteMutation.isLoading ? "Submitting..." : "Confirm and submit"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
