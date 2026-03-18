import { ChangeEvent, useState } from "react";
import { Link } from "react-router-dom";
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

export default function Votings() {
  const { showAlert } = useAppAlert();
  const { data, isError, isLoading } = useVotings();
  const [selected, setSelected] = useState<null | number>(null);
  const [editingPanelId, setEditingPanelId] = useState<number | null>(null);
  const [showAddPanelModal, setShowAddPanelModal] = useState(false);
  const [showImportVotersModal, setShowImportVotersModal] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<ParsedVoter[]>([]);
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

  const selectedElection =
    (data as VotingRecord[] | undefined)?.find((election) => election.id === selected) ||
    null;

  const onClickVoting = (id: number) => {
    if (selected === id) {
      setSelected(null);
      setShowAddPanelModal(false);
      setShowImportVotersModal(false);
      return;
    }
    setSelected(id);
    setShowAddPanelModal(false);
    setShowImportVotersModal(false);
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
    const isConfirmed = window.confirm(
      "Delete this panel and all votes tied to its candidates?"
    );

    if (!isConfirmed) {
      return;
    }

    deletePanel.mutate({ panelId });
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

    try {
      for (const chunk of chunks) {
        const response = await importVoters.mutateAsync({
          votingId: selectedElection.id,
          voters: chunk,
        });

        importedCount += response.count;
      }

      showAlert(`Imported ${importedCount} voters into this election`, "success");
      setFileName("");
      setPreviewRows([]);
      setShowImportVotersModal(false);
      await utils.voting.getAll.invalidate();
      await utils.voting.getOneDetailed.invalidate();
    } catch (error) {
      showAlert(getErrorMessage(error, "Unable to import voters."));
    }
  };

  const onClearVoterList = () => {
    if (!selectedElection) {
      showAlert("Select an election first", "warning");
      return;
    }

    const isConfirmed = window.confirm(
      `Clear the entire voter list for "${selectedElection.name}"? This will also remove votes recorded for this election.`
    );

    if (!isConfirmed) {
      return;
    }

    clearVoters.mutate({
      votingId: selectedElection.id,
    });
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
                <div className="mt-8 rounded bg-slate-100 p-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Configure {selectedElection.name}
                  </h3>
                  <img
                    src={selectedElection.img || DEFAULT_ELECTION_IMAGE}
                    alt={selectedElection.name}
                    className="mt-4 h-24 w-24 rounded-2xl object-cover"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Create ballot panels, candidates, and the voter list directly
                    inside this election.
                  </p>
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="inline-flex rounded bg-emerald-600 px-4 py-2 font-semibold text-white"
                        onClick={() => setShowAddPanelModal(true)}
                      >
                        Add panel
                      </button>
                      <button
                        type="button"
                        className="inline-flex rounded bg-amber-500 px-4 py-2 font-semibold text-slate-950"
                        onClick={() => setShowImportVotersModal(true)}
                      >
                        Import voter list
                      </button>
                      <Link
                        to={`/admin/elections/${selectedElection.id}/voters`}
                        className="inline-flex rounded bg-slate-900 px-4 py-2 font-semibold text-white"
                      >
                        Open voter roster
                      </Link>
                      <Link
                        to={`/admin/elections/${selectedElection.id}/results`}
                        className="inline-flex rounded bg-blue-600 px-4 py-2 font-semibold text-white"
                      >
                        Open results
                      </Link>
                      <Link
                        to={`/results/${selectedElection.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded bg-indigo-600 px-4 py-2 font-semibold text-white"
                      >
                        Open public results
                      </Link>
                      <button
                        type="button"
                        className="inline-flex rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900"
                        onClick={onCopyPublicResultsLink}
                      >
                        Copy public results link
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="mb-3 text-lg font-semibold">
                      Election Panels
                    </h4>
                    {selectedElection.Panels.length === 0 && (
                      <p className="text-gray-600">No panels created yet.</p>
                    )}
                    <div className="grid gap-4 lg:grid-cols-2">
                      {selectedElection.Panels.map((panel) => (
                        <div
                          key={panel.id}
                          className="rounded p-5"
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
                            <div className="mt-4 rounded bg-white/15 p-4">
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
