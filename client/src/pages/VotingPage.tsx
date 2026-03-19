import { useEffect, useState } from "react";
import { CandidatesList } from "../components/CandidatesList";
import { TRPC_REACT } from "../utils/trpc";
import React from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import { useAppAlert } from "../utils/alerts";
import Modal from "react-bootstrap/Modal";
import type { OnlineDevice } from "../utils/firebaseApi";
import { logout } from "../store/features/authSlice";
import { useNavigate } from "react-router-dom";

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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { device } = useAppSelector((s) => s.auth);
  const { showAlert } = useAppAlert();

  const [devices, setDevices] = useState<OnlineDevice[]>([]);
  const [hasLoadedDevices, setHasLoadedDevices] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));

  TRPC_REACT.device.getConnectedDevices.useSubscription(undefined, {
    onData(data) {
      console.log("🚀 ~ onData ~ data:", data);
      setDevices(data as OnlineDevice[]);
      setHasLoadedDevices(true);
    },
    onError(err) {
      console.log("🚀 ~ onError ~ err:", err);
      setHasLoadedDevices(true);
    },
  });

  useEffect(() => {
    const onResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!device?.name || !hasLoadedDevices) {
      return;
    }

    const currentDevice = devices.find((entry) => entry.name === device.name);
    if (currentDevice) {
      return;
    }

    showAlert("This device session was closed by an admin.", "warning");
    dispatch(logout());
    navigate("/");
  }, [device?.name, devices, dispatch, hasLoadedDevices, navigate, showAlert]);

  const currentDevice = devices.find((entry) => entry.name === device?.name);
  const isApproved = currentDevice?.approved !== false;
  const shouldFetchVoting = !!currentDevice?.approved;
  const { data, isError, isLoading } = TRPC_REACT.voting.getOneDetailed.useQuery({
    enabled: shouldFetchVoting,
  });
  const votingData = data as VotingDetailed | undefined;
  const voterId = currentDevice?.voterId;
  const { data: voterDetails } = TRPC_REACT.voter.getById.useQuery(
    { voterId: voterId as number },
    {
      enabled: !!voterId && !!currentDevice?.approved,
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

  const [selection, setSelection] = useState<Record<string, number>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const showPageLoading = !hasLoadedDevices || (shouldFetchVoting && isLoading);

  const isEnabled = !!voterId;
  const panelCount = votingData?.Panels.length || 0;
  const compactLayout =
    panelCount >= 4 ||
    viewportSize.width < 1380 ||
    viewportSize.height < 900;
  const ultraCompactLayout =
    panelCount >= 5 ||
    viewportSize.width < 1180 ||
    viewportSize.height < 820;
  const microCompactLayout =
    panelCount >= 5 ||
    viewportSize.width < 1080 ||
    viewportSize.height < 760;
  const smallActionButtons =
    viewportSize.width <= 1366 ||
    viewportSize.height <= 1024 ||
    compactLayout;

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
  const unselectedPositions = selectedCandidates
    .filter(({ candidate }) => !candidate)
    .map(({ label }) => label);

  const onVote = () => {
    if (Object.keys(selection).length === 0) {
      showAlert("Select at least one candidate before reviewing your ballot.", "warning");
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
      selections: positionOrder
        .filter((position) => !!selection[position])
        .map((position) => ({
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
      className="min-h-screen overflow-y-auto bg-cover bg-center bg-no-repeat lg:h-screen lg:overflow-hidden"
      style={{
        backgroundImage: votingData?.img
          ? `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.82)), url("${votingData.img}")`
          : undefined,
        backgroundColor: "#0f172a",
      }}
    >
      {showPageLoading && (
        <p className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-slate-200">
          loading...
        </p>
      )}
      {!showPageLoading && hasLoadedDevices && currentDevice && !isApproved && (
        <div className="flex h-full items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white/92 p-10 text-center shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
              Pending Approval
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              Device Awaiting Admin Approval
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-600">
              This device has been registered successfully. An administrator must approve it
              from the devices panel before the ballot becomes available.
            </p>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Device Name
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{device?.name}</p>
            </div>
          </div>
        </div>
      )}
      {isError && (
        <p className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-slate-200">
          error while fetching the data
        </p>
      )}
      {!isError && !showPageLoading && (!currentDevice || isApproved) && (
        <div
          className={`mx-auto flex min-h-screen max-w-[1600px] flex-col ${
            microCompactLayout
              ? "px-1.5 py-1.5 sm:px-2 sm:py-2"
              : ultraCompactLayout
                ? "px-2 py-2 md:px-3 md:py-3"
                : compactLayout
                  ? "px-2.5 py-2.5 md:px-3.5 md:py-3.5"
                  : "px-3 py-3 md:px-4 md:py-4"
          } lg:h-full`}
        >
          {!data && (
            <div className="mx-auto my-auto max-w-2xl rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur">
              <p className="tracking-tight text-slate-900 text-center">
                No active voting is configured yet. Ask an admin to create one.
              </p>
            </div>
          )}
          {data && (
            <div
              className={`flex flex-1 flex-col ${ultraCompactLayout ? "gap-2" : "gap-3"} lg:min-h-0`}
            >
              <div
                className={`rounded-[1.15rem] bg-white/84 shadow-2xl backdrop-blur ${
                  microCompactLayout
                    ? "p-1"
                    : ultraCompactLayout
                      ? "p-1.5"
                      : "p-2"
                }`}
              >
                <div
                  className={`grid items-stretch gap-1.5 ${
                    microCompactLayout
                      ? "md:grid-cols-[158px_minmax(0,1fr)]"
                      : ultraCompactLayout
                        ? "md:grid-cols-[170px_minmax(0,1fr)]"
                        : "md:grid-cols-[185px_minmax(0,1fr)]"
                  }`}
                >
                  <div
                    className={`rounded-[0.95rem] bg-slate-900 text-white shadow-lg ${
                      microCompactLayout
                        ? "p-1.5"
                        : ultraCompactLayout
                          ? "p-1.5"
                          : "px-2 py-1.5"
                    }`}
                  >
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-slate-300">
                      Device
                    </p>
                    <p
                      className={`mt-0.5 font-semibold ${
                        microCompactLayout
                          ? "text-[0.78rem]"
                          : ultraCompactLayout
                            ? "text-[0.82rem]"
                            : "text-[0.88rem]"
                      }`}
                    >
                      {device?.name}
                    </p>
                    <div className="mt-1.5 border-t border-white/10 pt-1.5">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-slate-300">
                        Voter Number
                      </p>
                      <p
                        className={`mt-0.5 font-bold ${
                          microCompactLayout
                            ? "text-[0.86rem]"
                            : ultraCompactLayout
                              ? "text-[0.9rem]"
                              : "text-[0.96rem]"
                        }`}
                      >
                        {voterId ?? "Not assigned"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`rounded-[0.95rem] bg-white shadow-lg ${
                      microCompactLayout
                        ? "p-1.5"
                      : ultraCompactLayout
                          ? "p-1.5"
                          : "px-2.5 py-2"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <div className="min-w-0">
                        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Active Election
                        </p>
                        <h1
                          className={`mt-0.5 truncate font-bold tracking-tight text-slate-900 ${
                            microCompactLayout
                              ? "text-[0.9rem]"
                              : ultraCompactLayout
                                ? "text-[0.96rem]"
                                : "text-[1.02rem]"
                          }`}
                        >
                          {votingData?.name}
                        </h1>
                      </div>
                      <p className="pt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Voter Details
                      </p>
                    </div>
                    {assignedVoter ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-700">
                        <p
                          className={`truncate ${
                            microCompactLayout
                              ? "max-w-full text-[0.68rem]"
                              : ultraCompactLayout
                                ? "max-w-[48%] text-[0.72rem]"
                                : "max-w-[48%] text-[0.75rem]"
                          }`}
                        >
                          <b>Name:</b> {assignedVoter.firstAndMiddleName}{" "}
                          {assignedVoter.lastName}
                        </p>
                        <p
                          className={`truncate ${
                            microCompactLayout
                              ? "max-w-full text-[0.68rem]"
                              : ultraCompactLayout
                                ? "max-w-[34%] text-[0.72rem]"
                                : "max-w-[34%] text-[0.75rem]"
                          }`}
                        >
                          <b>Phone:</b> {assignedVoter.phone}
                        </p>
                        <p
                          className={`truncate ${
                            microCompactLayout
                              ? "w-full text-[0.68rem]"
                              : "w-full text-[0.72rem]"
                          }`}
                        >
                          <b>Address:</b> {assignedVoter.streetAddress},{" "}
                          {assignedVoter.city}, {assignedVoter.state}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[0.72rem] text-slate-600">
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
                  <div
                    className={`flex-1 rounded-[1.8rem] bg-white/82 shadow-2xl backdrop-blur ${
                      microCompactLayout
                        ? "p-1.5"
                      : ultraCompactLayout
                          ? "p-2"
                          : compactLayout
                            ? "p-2.5"
                            : "p-3.5 md:p-4"
                    } overflow-hidden lg:min-h-0`}
                  >
                    <CandidatesList
                      panels={votingData?.Panels || []}
                      selection={selection}
                      setSelection={onSelection}
                      panelCount={panelCount}
                      compactLayout={compactLayout}
                      ultraCompactLayout={ultraCompactLayout}
                      microCompactLayout={microCompactLayout}
                    />
                  </div>
                  <div className="flex justify-center pb-1">
                    <div
                      className={`flex w-full max-w-[540px] flex-col items-stretch rounded-[1.75rem] bg-slate-950/90 shadow-2xl backdrop-blur sm:flex-row ${
                        microCompactLayout
                          ? "gap-1.5 px-3 py-2"
                        : ultraCompactLayout
                            ? "gap-2 px-3.5 py-2.5"
                            : smallActionButtons
                              ? "gap-2 px-3.5 py-2.5"
                              : "gap-3 px-5 py-4"
                      }`}
                    >
                      <button
                        className={`rounded-xl bg-slate-200 font-bold text-black hover:bg-slate-300 ${
                          microCompactLayout
                            ? "w-full px-3 py-2 text-sm sm:min-w-[120px]"
                          : ultraCompactLayout
                              ? "w-full px-4 py-2 text-sm sm:min-w-[140px]"
                              : smallActionButtons
                                ? "w-full px-4 py-2 text-sm sm:min-w-[140px]"
                                : "w-full px-5 py-3 text-lg sm:min-w-[160px]"
                        }`}
                        onClick={onClear}
                      >
                        Clear Selections
                      </button>
                      <button
                        className={`rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 ${
                          microCompactLayout
                            ? "w-full px-4 py-2 text-sm sm:min-w-[160px]"
                          : ultraCompactLayout
                              ? "w-full px-5 py-2 text-sm sm:min-w-[180px]"
                              : smallActionButtons
                                ? "w-full px-5 py-2 text-sm sm:min-w-[180px]"
                                : "w-full px-6 py-3 text-lg sm:min-w-[220px]"
                        }`}
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
          {unselectedPositions.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Some positions are blank.</p>
              <p className="mt-1">
                You are about to submit a partial ballot. No vote will be cast for{" "}
                {unselectedPositions.join(", ")}.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {selectedCandidates.map(({ position, label, candidate }) => (
              <div
                key={position}
                className="relative overflow-hidden rounded-2xl border border-slate-200 px-4 py-3"
                style={{
                  backgroundImage: candidate?.img
                    ? `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.78)), url("${candidate.img}")`
                    : undefined,
                  backgroundColor: candidate?.img ? undefined : "#f8fafc",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                    candidate?.img ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  {label}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    candidate?.img ? "text-white" : "text-slate-900"
                  }`}
                >
                  {candidate?.name || "Not selected"}
                </p>
                {candidate?.panelName && (
                  <p
                    className={`text-sm ${
                      candidate?.img ? "text-slate-200" : "text-slate-600"
                    }`}
                  >
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
