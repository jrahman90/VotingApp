import { ChangeEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TRPC_REACT } from "../utils/trpc";
import { useAppAlert } from "../utils/alerts";
import Dropdown from "react-bootstrap/Dropdown";
import { logout } from "../store/features/authSlice";
import { useAppDispatch, useAppSelector } from "../store/store";

interface ElectionVoterDetails {
  id: number;
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

interface ElectionDetails {
  id: number;
  name: string;
  img: string;
  votedVoterIds: number[];
  Voters: {
    id: number;
    votingId: number;
    voterId: number;
    extraFields?: Record<string, string> | null;
    Voter: ElectionVoterDetails;
  }[];
}

const PAGE_SIZE = 100;

interface ConnectedDevice {
  id: number;
  name: string;
  voterId?: number;
}

interface RosterColumn {
  key: string;
  label: string;
  getValue: (entry: ElectionDetails["Voters"][number]) => string;
}

const BASE_ROSTER_COLUMNS: RosterColumn[] = [
  {
    key: "voterId",
    label: "Voter ID",
    getValue: (entry) => String(entry.Voter.voterId),
  },
  {
    key: "firstAndMiddleName",
    label: "First & Middle Name",
    getValue: (entry) => entry.Voter.firstAndMiddleName,
  },
  {
    key: "lastName",
    label: "Last Name",
    getValue: (entry) => entry.Voter.lastName,
  },
  {
    key: "streetAddress",
    label: "Street Address",
    getValue: (entry) => entry.Voter.streetAddress,
  },
  {
    key: "city",
    label: "City",
    getValue: (entry) => entry.Voter.city,
  },
  {
    key: "state",
    label: "State",
    getValue: (entry) => entry.Voter.state,
  },
  {
    key: "phone",
    label: "Phone",
    getValue: (entry) => entry.Voter.phone,
  },
  {
    key: "yob",
    label: "YOB",
    getValue: (entry) =>
      Number.isFinite(entry.Voter.yob) ? String(entry.Voter.yob) : "",
  },
  {
    key: "permanentAddress",
    label: "Permanent Address",
    getValue: (entry) => entry.Voter.permanentAddress,
  },
  {
    key: "comments",
    label: "Comments",
    getValue: (entry) => entry.Voter.comments || "",
  },
];

export function ElectionVotersPage({
  operatorMode = false,
}: {
  operatorMode?: boolean;
}) {
  const { showAlert } = useAppAlert();
  const params = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { staff } = useAppSelector((state) => state.auth);
  const votingId = operatorMode
    ? typeof staff?.assignedVotingId === "number"
      ? staff.assignedVotingId
      : Number.NaN
    : Number(params.votingId);
  const [query, setQuery] = useState("");
  const [selectedDeviceByVoter, setSelectedDeviceByVoter] = useState<
    Record<number, string>
  >({});
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);

  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = TRPC_REACT.voting.getRoster.useQuery(
    { votingId },
    { enabled: Number.isFinite(votingId) }
  );

  const election = data as ElectionDetails | null;

  const onLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const assignDevice = TRPC_REACT.device.assignVoter.useMutation({
    onError(error) {
      showAlert(error.message);
    },
  });

  const unassignDevice = TRPC_REACT.device.unassignVoter.useMutation({
    onError(error) {
      showAlert(error.message);
    },
  });

  TRPC_REACT.device.getConnectedDevices.useSubscription(undefined, {
    onData(data) {
      setDevices(data as unknown as ConnectedDevice[]);
    },
    onError(error) {
      console.log("🚀 ~ device subscription error:", error);
    },
  });

  const filteredVoters = useMemo(() => {
    if (!election) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return election.Voters;
    }

    return election.Voters.filter((entry) => {
      const fullName =
        `${entry.Voter.firstAndMiddleName} ${entry.Voter.lastName}`.toLowerCase();
      return (
        String(entry.Voter.voterId).includes(normalizedQuery) ||
        fullName.includes(normalizedQuery)
      );
    });
  }, [election, query]);

  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedVoters = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVoters.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredVoters]);

  const visibleColumns = useMemo(() => {
    if (!election) {
      return [];
    }

    const baseColumns = BASE_ROSTER_COLUMNS.filter((column) =>
      election.Voters.some((entry) => column.getValue(entry).trim())
    );

    const extraColumnLabels = Array.from(
      new Set(
        election.Voters.flatMap((entry) => Object.keys(entry.extraFields || {}))
      )
    ).sort((left, right) => left.localeCompare(right));

    const extraColumns: RosterColumn[] = extraColumnLabels.map((label) => ({
      key: `extra:${label}`,
      label,
      getValue: (entry) => entry.extraFields?.[label] || "",
    }));

    return [...baseColumns, ...extraColumns];
  }, [election]);

  const votedVoterIds = useMemo(
    () => new Set(election?.votedVoterIds || []),
    [election]
  );
  const backToAdminUrl = election
    ? `/admin?tab=votings&electionId=${election.id}`
    : "/admin?tab=votings";

  const onAssignDeviceToVoter = (voterId: number) => {
    const deviceName = selectedDeviceByVoter[voterId];

    if (!deviceName) {
      showAlert("Select a device first", "warning");
      return;
    }

    assignDevice.mutate({
      name: deviceName,
      voterId,
    });
  };

  const onUnassignDevice = (deviceName: string) => {
    unassignDevice.mutate({
      name: deviceName,
    });
  };

  if (isLoading) {
    return <p className="py-10 text-center text-gray-600">Loading voters...</p>;
  }

  if (operatorMode && !Number.isFinite(votingId)) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          Operator Access
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          No election assigned
        </h1>
        <p className="mt-3 text-slate-600">
          An admin needs to assign you to an election before you can manage voter check-in.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 rounded bg-slate-900 px-4 py-2 font-semibold text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (isError || !election) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-600">Unable to load this election roster.</p>
        {operatorMode ? (
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 rounded bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            Logout
          </button>
        ) : (
          <Link
            className="mt-4 inline-block text-blue-600"
            to="/admin?tab=votings"
          >
            Back to admin
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              {operatorMode ? "Assigned Election" : "Election Voters"}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {election.name}
            </h1>
          </div>
          {operatorMode ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded bg-slate-900 px-4 py-2 font-semibold text-white"
            >
              Logout
            </button>
          ) : (
            <Link
              to={backToAdminUrl}
              className="rounded bg-slate-900 px-4 py-2 font-semibold text-white"
            >
              Back to admin
            </Link>
          )}
        </div>

        <div className="mb-6 rounded bg-slate-100 p-4">
          <input
            className="w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900"
            placeholder="Search by voter number or name"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              {
                setQuery(event.target.value);
                setPage(1);
              }
            }
          />
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {pagedVoters.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredVoters.length)} of{" "}
            {filteredVoters.length} voters
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="min-w-[96px] text-center font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="border-b text-left">
                {visibleColumns.map((column) => (
                  <th key={column.key} className="py-3 px-4">
                    {column.label}
                  </th>
                ))}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedVoters.map((entry) => {
                const assignedDevice = devices.find(
                  (device) => device.voterId === entry.Voter.voterId
                );
                const hasVoted = votedVoterIds.has(entry.Voter.voterId);
                const selectedDeviceName =
                  selectedDeviceByVoter[entry.Voter.voterId] ||
                  assignedDevice?.name ||
                  "";

                return (
                  <tr key={entry.id} className="border-b align-top">
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className="max-w-[240px] whitespace-pre-wrap break-words py-3 px-4 text-sm text-slate-700"
                      >
                        {column.getValue(entry) || "—"}
                      </td>
                    ))}
                    <td className="py-3 px-4">
                      {hasVoted ? (
                        <span className="rounded bg-green-100 px-2 py-1 text-sm font-semibold text-green-800">
                          Voted
                        </span>
                      ) : assignedDevice ? (
                        <span className="rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
                          Assigned
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-700">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 min-w-[220px]">
                      <Dropdown className="w-full">
                        <Dropdown.Toggle
                          disabled={hasVoted}
                          variant="light"
                          className="flex min-h-[52px] w-full items-center justify-between rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-left text-base font-semibold text-slate-900 shadow-sm hover:border-slate-400 hover:bg-slate-50"
                        >
                          <span className="truncate">
                            {selectedDeviceName || "Select device"}
                          </span>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-full min-w-[260px] rounded-2xl border border-slate-200 p-2 shadow-2xl">
                          <Dropdown.Item
                            active={!selectedDeviceName}
                            className="min-h-[52px] rounded-xl px-4 py-3 text-base font-medium"
                            onClick={() =>
                              setSelectedDeviceByVoter((prev) => ({
                                ...prev,
                                [entry.Voter.voterId]: "",
                              }))
                            }
                          >
                            Select device
                          </Dropdown.Item>
                          {devices.map((device) => {
                            const isUsedByAnotherVoter =
                              !!device.voterId &&
                              device.voterId !== entry.Voter.voterId;

                            return (
                              <Dropdown.Item
                                key={device.id}
                                active={selectedDeviceName === device.name}
                                disabled={isUsedByAnotherVoter}
                                className="min-h-[52px] rounded-xl px-4 py-3 text-base font-medium"
                                onClick={() =>
                                  setSelectedDeviceByVoter((prev) => ({
                                    ...prev,
                                    [entry.Voter.voterId]: device.name,
                                  }))
                                }
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="truncate">{device.name}</span>
                                  {isUsedByAnotherVoter && (
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                      In use
                                    </span>
                                  )}
                                </div>
                              </Dropdown.Item>
                            );
                          })}
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                    <td className="py-3 px-4 min-w-[220px]">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={hasVoted || !selectedDeviceName}
                          className="min-h-[52px] rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                          onClick={() =>
                            onAssignDeviceToVoter(entry.Voter.voterId)
                          }
                        >
                          Assign
                        </button>
                        {assignedDevice && !hasVoted && (
                          <button
                            type="button"
                            className="min-h-[52px] rounded-xl bg-slate-200 px-5 py-3 text-base font-semibold text-slate-900"
                            onClick={() => onUnassignDevice(assignedDevice.name)}
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
