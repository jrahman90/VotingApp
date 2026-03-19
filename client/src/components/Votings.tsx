import { ChangeEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import { MdAdd } from "react-icons/md";
import { useVotings } from "../hooks/useVotings";
import { useCreateVoting } from "../hooks/useCreateVoting";
import VotingsList from "./VotingsList";
import {
  PanelForm,
  PanelFormType,
  initialPanelFormState,
} from "./PanelForm";
import { useCreatePanel } from "../hooks/useCreatePanel";
import { useUpdatePanel } from "../hooks/useUpdatePanel";
import * as XLSX from "xlsx";
import { TRPC_REACT } from "../utils/trpc";
import { uploadImageFile } from "../utils/images";
import { getErrorMessage, useAppAlert } from "../utils/alerts";
import { useAppSelector } from "../store/store";

const DEFAULT_ELECTION_IMAGE =
  "https://placehold.co/240x240/png?text=Election";

interface VotingRecord {
  id: number;
  name: string;
  img: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  Votes: {
    id: number;
    voterId: number;
    candidateId: number;
    votingId: number;
    deviceId: number;
  }[];
  Panels: ElectionPanel[];
  Voters: {
    id: number;
    createdAt: string;
    updatedAt: string;
    votingId: number;
    voterId: number;
    Voter: AssignedVoter;
  }[];
}

interface AssignedVoter {
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

interface StaffUserRecord {
  uid?: string;
  id: number;
  email: string;
  role?: "admin" | "operator";
  assignedVotingId?: number | null;
}

interface ElectionPanel {
  id: number;
  panelName: string;
  panelColor: string;
  textColor: string;
  img: string;
  votingId: number | null;
  createdAt: string;
  updatedAt: string;
  Candidates: {
    id: number;
    candidateId: number;
    Candidate: {
      id: number;
      name: string;
      img: string;
      position: string;
    };
  }[];
}

type ParsedVoter = Omit<AssignedVoter, "id" | "comments"> & {
  comments?: string;
  extraFields?: Record<string, string>;
};

const HEADER_ALIASES = {
  voterId: ["voterid", "voter_id", "voter number", "id", "voter#", "voter no"],
  firstAndMiddleName: [
    "firstandmiddlename",
    "first_and_middle_name",
    "first middle name",
    "firstname",
    "first name",
  ],
  lastName: ["lastname", "last_name", "last name", "surname"],
  streetAddress: ["streetaddress", "street_address", "street address", "address"],
  city: ["city"],
  state: ["state", "st", "province"],
  phone: ["phone", "phone number", "phonenumber"],
  yob: ["yob", "yearofbirth", "year_of_birth", "birth year"],
  permanentAddress: [
    "permanentaddress",
    "permanent_address",
    "permanent address",
    "mailing address",
  ],
  comments: ["comments", "comment", "notes", "note"],
} as const;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const KNOWN_HEADER_NORMALIZED = new Set(
  Object.values(HEADER_ALIASES).flat().map((alias) => normalizeHeader(alias))
);

function getValue(row: Record<string, unknown>, aliases: readonly string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeHeader(key),
    value,
  ]);

  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === normalizeHeader(alias));
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function parseWorkbook(file: File, cb: (rows: ParsedVoter[]) => void) {
  const reader = new FileReader();

  reader.onload = (event) => {
    const data = event.target?.result;
    if (!data) {
      cb([]);
      return;
    }

    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: "",
    });

    const parsedRows = rawRows
      .map((row) => {
        const extraFields = Object.entries(row).reduce<Record<string, string>>(
          (accumulator, [key, value]) => {
            if (KNOWN_HEADER_NORMALIZED.has(normalizeHeader(key))) {
              return accumulator;
            }

            const normalizedValue = String(value ?? "").trim();
            if (!normalizedValue) {
              return accumulator;
            }

            accumulator[key.trim()] = normalizedValue;
            return accumulator;
          },
          {}
        );

        return {
          voterId: Number(getValue(row, HEADER_ALIASES.voterId)),
          firstAndMiddleName: String(
            getValue(row, HEADER_ALIASES.firstAndMiddleName) || ""
          ).trim(),
          lastName: String(getValue(row, HEADER_ALIASES.lastName) || "").trim(),
          streetAddress: String(
            getValue(row, HEADER_ALIASES.streetAddress) || ""
          ).trim(),
          city: String(getValue(row, HEADER_ALIASES.city) || "").trim(),
          state: String(getValue(row, HEADER_ALIASES.state) || "").trim(),
          phone: String(getValue(row, HEADER_ALIASES.phone) || "").trim(),
          yob: Number(getValue(row, HEADER_ALIASES.yob)),
          permanentAddress: String(
            getValue(row, HEADER_ALIASES.permanentAddress) || ""
          ).trim(),
          comments: String(getValue(row, HEADER_ALIASES.comments) || "").trim(),
          extraFields,
        };
      })
      .filter(
        (row) =>
          Number.isFinite(row.voterId) &&
          Number.isFinite(row.yob) &&
          row.firstAndMiddleName &&
          row.lastName &&
          row.streetAddress &&
          row.city &&
          row.state &&
          row.permanentAddress
      );

    cb(parsedRows);
  };

  reader.readAsArrayBuffer(file);
}

function chunkRows<T>(rows: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }

  return chunks;
}

function VotingForm() {
  const { showAlert } = useAppAlert();
  const [showModal, setShowModal] = useState(false);
  const [votingName, setVotingName] = useState("");
  const [votingImage, setVotingImage] = useState(DEFAULT_ELECTION_IMAGE);
  const mutation = useCreateVoting(() => {
    setVotingName("");
    setVotingImage(DEFAULT_ELECTION_IMAGE);
    setShowModal(false);
  });

  const onCreateVoting = () => {
    if (!votingName) {
      showAlert("Missing election name", "warning");
      return;
    }
    mutation.mutate({
      name: votingName,
      img: votingImage.trim() || DEFAULT_ELECTION_IMAGE,
    });
  };

  const onElectionImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const image = await uploadImageFile(file, "elections");
      setVotingImage(image);
    } catch (error) {
      showAlert(getErrorMessage(error, "Unable to upload image."));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition hover:bg-blue-700"
        aria-label="Add election"
      >
        <MdAdd size={34} />
      </button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Election</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-col gap-3">
            <input
              className="w-full rounded border border-slate-300 px-3 py-2"
              name="votingName"
              value={votingName}
              placeholder="Election name"
              onChange={(e) => setVotingName(e.target.value)}
            />
            <input
              className="w-full rounded border border-slate-300 px-3 py-2"
              name="votingImage"
              value={votingImage}
              placeholder="Election image URL"
              onChange={(e) => setVotingImage(e.target.value)}
            />
            <input
              className="w-full"
              type="file"
              accept="image/*"
              onChange={onElectionImageUpload}
            />
            <p className="text-xs text-gray-600">
              Use a link or upload a file. Leave the image URL as-is to use the
              default election placeholder.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900"
          >
            Cancel
          </button>
          <button
            className="rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
            type="button"
            onClick={onCreateVoting}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? "Creating..." : "Create election"}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default function Votings({
  initialSelectedElectionId = null,
}: {
  initialSelectedElectionId?: number | null;
}) {
  const { showAlert, showConfirmAlert } = useAppAlert();
  const authStaff = useAppSelector((state) => state.auth.staff);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isError, isLoading } = useVotings();
  const { data: staffUsers } = TRPC_REACT.staff.getAll.useQuery();
  const [selected, setSelected] = useState<null | number>(initialSelectedElectionId);
  const [editingPanelId, setEditingPanelId] = useState<number | null>(null);
  const [showAddPanelModal, setShowAddPanelModal] = useState(false);
  const [showImportVotersModal, setShowImportVotersModal] = useState(false);
  const [fileName, setFileName] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");
  const [operatorPassword, setOperatorPassword] = useState("");
  const [previewRows, setPreviewRows] = useState<ParsedVoter[]>([]);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    imported: number;
  } | null>(null);
  const createPanel = useCreatePanel(() => setShowAddPanelModal(false));
  const updatePanel = useUpdatePanel(() => setEditingPanelId(null));
  const utils = TRPC_REACT.useUtils();
  const deletePanel = TRPC_REACT.panel.deletePanel.useMutation({
    onSuccess() {
      utils.voting.getAll.invalidate();
      utils.voting.getOneDetailed.invalidate();
      setEditingPanelId(null);
    },
    onError(error) {
      showAlert(error.message);
    },
  });
  const reorderCandidates = TRPC_REACT.panel.reorderCandidates.useMutation({
    onSuccess() {
      utils.voting.getAll.invalidate();
      utils.voting.getOneDetailed.invalidate();
    },
    onError(error) {
      showAlert(error.message);
    },
  });
  const importVoters = TRPC_REACT.voter.importMany.useMutation({
    onError(error) {
      showAlert(error.message);
    },
  });
  const clearVoters = TRPC_REACT.voting.clearVoters.useMutation({
    onSuccess(data) {
      showAlert(`Cleared ${data.count} voters from this election`, "success");
      setFileName("");
      setPreviewRows([]);
      utils.voting.getAll.invalidate();
      utils.voting.getOneDetailed.invalidate();
    },
    onError(error) {
      showAlert(error.message);
    },
  });
  const resetVotes = TRPC_REACT.voting.resetVotes.useMutation({
    onSuccess(data) {
      showAlert(
        data.count > 0
          ? `Reset ${data.count} cast ballots for this election.`
          : "This election had no cast ballots to reset.",
        "success"
      );
      utils.voting.getAll.invalidate();
      utils.voting.getOneDetailed.invalidate();
      utils.voting.getById.invalidate({ votingId: selectedElection?.id });
      utils.voting.getRoster.invalidate({ votingId: selectedElection?.id });
    },
    onError(error) {
      showAlert(error.message);
    },
  });
  const updateStaffAccess = TRPC_REACT.staff.updateAccess.useMutation({
    onSuccess() {
      showAlert("User access updated.", "success");
      utils.staff.getAll.invalidate();
    },
    onError(error) {
      showAlert(error.message);
    },
  });
  const createOperator = TRPC_REACT.staff.createOperator.useMutation({
    onSuccess() {
      showAlert("Operator account created.", "success");
      setOperatorEmail("");
      setOperatorPassword("");
      utils.staff.getAll.invalidate();
    },
    onError(error) {
      showAlert(error.message);
    },
  });

  const selectedElection =
    (data as VotingRecord[] | undefined)?.find((election) => election.id === selected) ||
    null;

  useEffect(() => {
    if (initialSelectedElectionId) {
      setSelected(initialSelectedElectionId);
    }
  }, [initialSelectedElectionId]);

  const onClickVoting = (id: number) => {
    if (selected === id) {
      setSelected(null);
      setShowAddPanelModal(false);
      setShowImportVotersModal(false);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("electionId");
      setSearchParams(nextParams, { replace: true });
      return;
    }
    setSelected(id);
    setShowAddPanelModal(false);
    setShowImportVotersModal(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", "votings");
    nextParams.set("electionId", String(id));
    setSearchParams(nextParams, { replace: true });
  };

  const onCreatePanel = (payload: PanelFormType) => {
    if (!selectedElection) {
      showAlert("Select an election first", "warning");
      return;
    }

    createPanel.mutate({
      ...payload,
      votingId: selectedElection.id,
    });
  };

  const onUpdatePanel = (payload: PanelFormType, panelId: number) => {
    if (!selectedElection) {
      showAlert("Select an election first", "warning");
      return;
    }

    updatePanel.mutate({
      ...payload,
      panelId,
      votingId: selectedElection.id,
    });
  };

  const onDeletePanel = (panelId: number) => {
    showConfirmAlert("Delete this panel and all votes tied to its candidates?", [
      {
        label: "Cancel",
        variant: "secondary",
        onClick: () => undefined,
      },
      {
        label: "Delete panel",
        variant: "danger",
        onClick: () =>
          deletePanel.mutate({
            panelId,
            votingId: selectedElection.id,
          }),
      },
    ]);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    parseWorkbook(file, (rows) => {
      if (rows.length === 0) {
        showAlert("No valid voter rows were found in that file.", "warning");
      }
      setPreviewRows(rows);
    });
  };

  const onImportVoters = async () => {
    if (!selectedElection) {
      showAlert("Select an election first", "warning");
      return;
    }

    if (previewRows.length === 0) {
      showAlert("No valid voter rows are ready to import.", "warning");
      return;
    }

    const chunks = chunkRows(previewRows, 250);
    let importedCount = 0;
    setImportProgress({
      total: previewRows.length,
      imported: 0,
    });

    try {
      for (const chunk of chunks) {
        const response = await importVoters.mutateAsync({
          votingId: selectedElection.id,
          voters: chunk,
        });

        importedCount += response.count;
        setImportProgress({
          total: previewRows.length,
          imported: importedCount,
        });
      }

      showAlert(`Imported ${importedCount} voters into this election`, "success");
      setFileName("");
      setPreviewRows([]);
      setImportProgress(null);
      setShowImportVotersModal(false);
      await utils.voting.getAll.invalidate();
      await utils.voting.getOneDetailed.invalidate();
    } catch (error) {
      setImportProgress(null);
      showAlert(getErrorMessage(error, "Unable to import voters."));
    }
  };

  const onClearVoterList = () => {
    if (!selectedElection) {
      showAlert("Select an election first", "warning");
      return;
    }

    showConfirmAlert(
      `Clear the entire voter list for "${selectedElection.name}"? This will also remove votes recorded for this election.`,
      [
        {
          label: "Cancel",
          variant: "secondary",
          onClick: () => undefined,
        },
        {
          label: "Clear voter list",
          variant: "danger",
          onClick: () =>
            clearVoters.mutate({
              votingId: selectedElection.id,
            }),
        },
      ]
    );
  };

  const onCopyPublicResultsLink = async () => {
    if (!selectedElection) {
      return;
    }

    const link = `${window.location.origin}/results/${selectedElection.id}`;

    try {
      await navigator.clipboard.writeText(link);
      showAlert("Public live-results link copied.", "success");
    } catch (error) {
      showAlert(getErrorMessage(error, "Unable to copy the results link."));
    }
  };

  const onResetElection = () => {
    if (!selectedElection) {
      showAlert("Select an election first", "warning");
      return;
    }

    showConfirmAlert(
      `Reset "${selectedElection.name}"? This will permanently remove all cast ballots and clear the election results.`,
      [
        {
          label: "Cancel",
          variant: "secondary",
          onClick: () => undefined,
        },
        {
          label: "Reset election",
          variant: "danger",
          onClick: () => resetVotes.mutate({ votingId: selectedElection.id }),
        },
      ]
    );
  };

  const onCreateOperator = () => {
    if (!selectedElection) {
      showAlert("Select an election first", "warning");
      return;
    }

    if (!operatorEmail.trim() || !operatorPassword.trim()) {
      showAlert("Operator email and password are required.", "warning");
      return;
    }

    createOperator.mutate({
      email: operatorEmail,
      password: operatorPassword,
      assignedVotingId: selectedElection.id,
    });
  };

  return (
    <div>
      <VotingForm />
      {isLoading && (
        <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
          Loading elections...
        </p>
      )}
      {isError && (
        <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
          Error fetching elections
        </p>
      )}
      {data && (
        <>
          {data?.length === 0 && (
            <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
              No elections
            </p>
          )}
          {data?.length > 0 && (
            <>
              <VotingsList
                data={data as VotingRecord[]}
                onClickVoting={onClickVoting}
                selected={selected as number}
              />
              {selectedElection && (
                <div className="mt-8 space-y-6 rounded-[2rem] bg-slate-100/90 p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Election Overview
                      </p>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                        <img
                          src={selectedElection.img || DEFAULT_ELECTION_IMAGE}
                          alt={selectedElection.name}
                          className="h-24 w-24 rounded-3xl object-cover ring-1 ring-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                              {selectedElection.name}
                            </h3>
                            {selectedElection.isActive && (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Manage ballot panels, voter rosters, operators, and published results for this election from one place.
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Panels
                              </p>
                              <p className="mt-1 text-2xl font-bold text-slate-900">
                                {selectedElection.Panels.length}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Roster
                              </p>
                              <p className="mt-1 text-2xl font-bold text-slate-900">
                                {selectedElection.Voters.length}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Ballots Cast
                              </p>
                              <p className="mt-1 text-2xl font-bold text-slate-900">
                                {new Set(selectedElection.Votes.map((vote) => vote.voterId)).size}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm ring-1 ring-slate-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                        Quick Actions
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white"
                          onClick={() => setShowAddPanelModal(true)}
                        >
                          Add panel
                        </button>
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-slate-950"
                          onClick={() => setShowImportVotersModal(true)}
                        >
                          Import voter list
                        </button>
                        <Link
                          to={`/admin/elections/${selectedElection.id}/voters`}
                          className="inline-flex justify-center rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white ring-1 ring-white/15"
                        >
                          Open voter roster
                        </Link>
                        <Link
                          to={`/admin/elections/${selectedElection.id}/results`}
                          className="inline-flex justify-center rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
                        >
                          Open results
                        </Link>
                        <Link
                          to={`/admin/elections/${selectedElection.id}/ballots`}
                          className="inline-flex justify-center rounded-2xl bg-violet-700 px-4 py-3 font-semibold text-white"
                        >
                          Print cast ballots
                        </Link>
                        <Link
                          to={`/results/${selectedElection.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex justify-center rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white"
                        >
                          Open public results
                        </Link>
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900"
                          onClick={onCopyPublicResultsLink}
                        >
                          Copy public results link
                        </button>
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-2xl bg-red-700 px-4 py-3 font-semibold text-white"
                          onClick={onResetElection}
                          disabled={resetVotes.isLoading}
                        >
                          {resetVotes.isLoading ? "Resetting..." : "Reset election"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <h4 className="text-lg font-semibold text-slate-900">
                      Operator access
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Operators can only sign in to the voter roster for the election
                      you assign them to.
                    </p>
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Create operator account
                      </p>
                      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]">
                        <input
                          type="email"
                          value={operatorEmail}
                          onChange={(event) => setOperatorEmail(event.target.value)}
                          placeholder="operator@email.com"
                          className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
                        />
                        <input
                          type="password"
                          value={operatorPassword}
                          onChange={(event) => setOperatorPassword(event.target.value)}
                          placeholder="Temporary password"
                          className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={onCreateOperator}
                          disabled={createOperator.isLoading}
                          className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {createOperator.isLoading ? "Creating..." : "Create operator"}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        New operators are automatically assigned to this election.
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {((staffUsers as StaffUserRecord[] | undefined) || []).length === 0 && (
                        <p className="text-sm text-slate-500">
                          No staff users have signed in yet.
                        </p>
                      )}
                      {((staffUsers as StaffUserRecord[] | undefined) || []).map((staffUser) => {
                        const role = staffUser.role || "admin";
                        const isCurrentUser = !!authStaff?.uid && authStaff.uid === staffUser.uid;
                        const assignedHere =
                          role === "operator" &&
                          staffUser.assignedVotingId === selectedElection.id;

                        return (
                          <div
                            key={staffUser.uid || staffUser.id}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {staffUser.email}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                <span
                                  className={`rounded-full px-2 py-1 font-semibold ${
                                    role === "admin"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {role === "admin" ? "Admin" : "Operator"}
                                </span>
                                {staffUser.assignedVotingId && role === "operator" && (
                                  <span className="rounded-full bg-slate-200 px-2 py-1 font-semibold text-slate-700">
                                    Assigned election #{staffUser.assignedVotingId}
                                  </span>
                                )}
                                {assignedHere && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                                    Assigned here
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!isCurrentUser && (
                                <>
                                  <button
                                    type="button"
                                    className="rounded bg-amber-500 px-4 py-2 font-semibold text-slate-950"
                                    onClick={() =>
                                      updateStaffAccess.mutate({
                                        staffUid: staffUser.uid as string,
                                        role: "operator",
                                        assignedVotingId: selectedElection.id,
                                      })
                                    }
                                  >
                                    Assign here as operator
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900"
                                    onClick={() =>
                                      updateStaffAccess.mutate({
                                        staffUid: staffUser.uid as string,
                                        role: "operator",
                                        assignedVotingId: null,
                                      })
                                    }
                                  >
                                    Clear operator assignment
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
                                    onClick={() =>
                                      updateStaffAccess.mutate({
                                        staffUid: staffUser.uid as string,
                                        role: "admin",
                                        assignedVotingId: null,
                                      })
                                    }
                                  >
                                    Make admin
                                  </button>
                                </>
                              )}
                              {isCurrentUser && (
                                <span className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                                  Current user
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">
                          Election Panels
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          Review the live ballot structure and edit panel content in place.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-2xl bg-emerald-600 px-4 py-2.5 font-semibold text-white"
                        onClick={() => setShowAddPanelModal(true)}
                      >
                        Add another panel
                      </button>
                    </div>
                    {selectedElection.Panels.length === 0 && (
                      <p className="text-gray-600">No panels created yet.</p>
                    )}
                    <div className="grid gap-4 lg:grid-cols-2">
                      {selectedElection.Panels.map((panel) => (
                        <div
                          key={panel.id}
                          className={`rounded p-5 ${
                            editingPanelId === panel.id ? "lg:col-span-2" : ""
                          }`}
                          style={{
                            backgroundColor: panel.panelColor,
                            color: panel.textColor,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={panel.img}
                              alt={panel.panelName}
                              className="h-12 w-12 rounded-full object-cover bg-white/30"
                            />
                            <div>
                              <p className="font-bold">{panel.panelName}</p>
                              <p className="text-sm opacity-80">
                                {panel.Candidates.length} candidates
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-3">
                            <button
                              type="button"
                              className="rounded bg-white/20 px-3 py-2 text-sm font-semibold"
                              onClick={() =>
                                setEditingPanelId((current) =>
                                  current === panel.id ? null : panel.id
                                )
                              }
                            >
                              {editingPanelId === panel.id
                                ? "Close editor"
                                : "Edit panel"}
                            </button>
                            <button
                              type="button"
                              className="rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white"
                              onClick={() => onDeletePanel(panel.id)}
                            >
                              Delete panel
                            </button>
                          </div>
                          {editingPanelId === panel.id && (
                            <div className="mt-4 rounded-2xl bg-white/15 p-4 md:p-5">
                              <PanelForm
                                ctaText="Update panel"
                                data={{
                                  ...initialPanelFormState,
                                  panelName: panel.panelName,
                                  panelColor: panel.panelColor,
                                  textColor: panel.textColor,
                                  img: panel.img,
                                  votingId: selectedElection.id,
                                  candidates: panel.Candidates.map(
                                    (candidateLink) => ({
                                      id: candidateLink.Candidate.id,
                                      name: candidateLink.Candidate.name,
                                      img: candidateLink.Candidate.img,
                                      position:
                                        candidateLink.Candidate.position,
                                    })
                                  ),
                                }}
                                onReorderCandidate={(fromIndex, toIndex) =>
                                  reorderCandidates.mutate({
                                    votingId: selectedElection.id,
                                    fromIndex,
                                    toIndex,
                                  })
                                }
                                onSubmit={(payload) =>
                                  onUpdatePanel(payload, panel.id)
                                }
                              />
                            </div>
                          )}
                          <div className="mt-4 space-y-2">
                            {panel.Candidates.map((candidateLink) => (
                              <div key={candidateLink.id} className="rounded bg-white/15 p-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={candidateLink.Candidate.img}
                                    alt={candidateLink.Candidate.name}
                                    className="h-12 w-12 rounded-full object-cover bg-white/20"
                                  />
                                  <div>
                                    <div>
                                      {candidateLink.Candidate.position}:{" "}
                                      {candidateLink.Candidate.name}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </>
      )}
      {selectedElection && (
        <>
          <Modal
            show={showAddPanelModal}
            onHide={() => setShowAddPanelModal(false)}
            centered
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Add Panel To {selectedElection.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <PanelForm
                ctaText="Create panel"
                votingId={selectedElection.id}
                onSubmit={onCreatePanel}
              />
            </Modal.Body>
          </Modal>

          <Modal
            show={showImportVotersModal}
            onHide={() => setShowImportVotersModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Import Voter List</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="rounded bg-zinc-100 p-4">
                <p className="mb-3 text-sm text-gray-700">
                  Upload Excel or CSV with columns:
                  `voterId, firstAndMiddleName, lastName, streetAddress, city, state, phone, yob, permanentAddress, comments`
                </p>
                <p className="mb-3 text-sm text-gray-700">
                  Any extra columns in the file will also be saved and shown on
                  this election&apos;s voter roster when present.
                </p>
                <div className="mb-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onClearVoterList}
                    disabled={clearVoters.isLoading}
                    className="rounded bg-red-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {clearVoters.isLoading
                      ? "Clearing voter list..."
                      : "Clear voter list"}
                  </button>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileChange}
                  className="mb-4 block"
                />
                {fileName && (
                  <p className="mb-3 text-sm text-gray-700">
                    Selected file: {fileName}
                  </p>
                )}
                {previewRows.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-700">
                      Ready to import {previewRows.length} voters.
                    </p>
                    {importProgress && (
                      <div className="rounded border border-slate-200 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                          <span>Import progress</span>
                          <span>
                            {importProgress.imported} / {importProgress.total}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                              width: `${
                                importProgress.total === 0
                                  ? 0
                                  : (importProgress.imported / importProgress.total) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={onImportVoters}
                      disabled={importVoters.isLoading}
                      className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {importVoters.isLoading
                        ? "Importing voters..."
                        : `Import ${previewRows.length} voters`}
                    </button>
                  </div>
                )}
              </div>
            </Modal.Body>
          </Modal>
        </>
      )}
    </div>
  );
}
