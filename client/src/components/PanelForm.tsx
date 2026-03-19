import { ChangeEvent, useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { uploadImageFile } from "../utils/images";
import { getErrorMessage, useAppAlert } from "../utils/alerts";

export type CandidatePosition = string;
const POSITION_OPTIONS: CandidatePosition[] = [
  "President",
  "Vice President",
  "Secretary",
];
const DEFAULT_PANEL_COLOR = "#1e3a8a";
const DEFAULT_TEXT_COLOR = "#ffffff";
const DEFAULT_PANEL_IMAGE =
  "https://placehold.co/120x120/png?text=Panel";
const DEFAULT_CANDIDATE_IMAGE =
  "https://placehold.co/120x120/png?text=Candidate";
const PANEL_COLOR_OPTIONS = [
  "#1e3a8a",
  "#7c2d12",
  "#065f46",
  "#4c1d95",
  "#0f172a",
  "#7f1d1d",
];
const TEXT_COLOR_OPTIONS = ["#ffffff", "#f8fafc", "#111827", "#1f2937"];
export const initialPanelFormState = {
  img: DEFAULT_PANEL_IMAGE,
  panelColor: DEFAULT_PANEL_COLOR,
  panelName: "",
  textColor: DEFAULT_TEXT_COLOR,
  votingId: 0,
  candidates: [
    {
      name: "",
      img: DEFAULT_CANDIDATE_IMAGE,
      position: "President" as CandidatePosition,
      id: undefined as number | undefined,
    },
    {
      name: "",
      img: DEFAULT_CANDIDATE_IMAGE,
      position: "Vice President" as CandidatePosition,
      id: undefined as number | undefined,
    },
    {
      name: "",
      img: DEFAULT_CANDIDATE_IMAGE,
      position: "Secretary" as CandidatePosition,
      id: undefined as number | undefined,
    },
  ],
};

export type PanelFormType = typeof initialPanelFormState;

interface PanelFormProps {
  ctaText: string;
  data?: PanelFormType;
  votingId?: number;
  onSubmit: (payload: PanelFormType) => void;
  onReorderCandidate?: (fromIndex: number, toIndex: number) => void;
}

export function PanelForm({
  ctaText,
  data,
  votingId,
  onSubmit,
  onReorderCandidate,
}: PanelFormProps) {
  const { showAlert } = useAppAlert();
  const [panel, setPanel] = useState(
    data || {
      ...initialPanelFormState,
      votingId: votingId || 0,
    }
  );

  useEffect(() => {
    if (data) {
      setPanel(data);
      return;
    }

    setPanel((prev) => ({
      ...prev,
      votingId: votingId || 0,
      panelColor: prev.panelColor || DEFAULT_PANEL_COLOR,
      textColor: prev.textColor || DEFAULT_TEXT_COLOR,
      img: prev.img || DEFAULT_PANEL_IMAGE,
    }));
  }, [data, votingId]);

  const onSubmitPanel = () => {
    const missingFields = [];

    if (!panel.votingId) {
      missingFields.push("election");
    }
    if (!panel.panelName.trim()) {
      missingFields.push("panel name");
    }
    if (!panel.panelColor) {
      missingFields.push("background color");
    }
    if (!panel.textColor) {
      missingFields.push("text color");
    }
    if (panel.candidates.some((candidate) => !candidate.name.trim())) {
      missingFields.push("all candidate names");
    }
    if (panel.candidates.some((candidate) => !candidate.position.trim())) {
      missingFields.push("all candidate roles");
    }
    if (panel.candidates.length === 0) {
      missingFields.push("at least one candidate");
    }

    if (missingFields.length > 0) {
      showAlert(`Missing panel data: ${missingFields.join(", ")}`, "warning");
      return;
    }

    onSubmit({
      ...panel,
      panelName: panel.panelName.trim(),
      img: panel.img.trim() || DEFAULT_PANEL_IMAGE,
      candidates: panel.candidates.map((candidate) => ({
        ...candidate,
        name: candidate.name.trim(),
        img: candidate.img.trim() || DEFAULT_CANDIDATE_IMAGE,
      })),
    });
    setPanel({
      ...initialPanelFormState,
      votingId: votingId || 0,
    });
  };

  const onAddCandidate = () => {
    setPanel((prev) => ({
      ...prev,
      candidates: [
        ...prev.candidates,
        {
          name: "",
          img: DEFAULT_CANDIDATE_IMAGE,
          position: "President" as CandidatePosition,
          id: undefined,
        },
      ],
    }));
  };

  const onRemoveCandidate = (idx: number) => {
    setPanel((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((_, itemIdx) => itemIdx !== idx),
    }));
  };

  const onMoveCandidate = (idx: number, direction: "up" | "down") => {
    setPanel((prev) => {
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.candidates.length) {
        return prev;
      }

      const candidates = [...prev.candidates];
      [candidates[idx], candidates[targetIdx]] = [
        candidates[targetIdx],
        candidates[idx],
      ];

      return {
        ...prev,
        candidates,
      };
    });

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx >= 0 && targetIdx < panel.candidates.length) {
      onReorderCandidate?.(idx, targetIdx);
    }
  };

  const onPanelImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const image = await uploadImageFile(file, "panels");
      setPanel((prev) => ({ ...prev, img: image }));
    } catch (error) {
      showAlert(getErrorMessage(error, "Unable to upload image."));
    }
  };

  const onCandidateImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const image = await uploadImageFile(file, "candidates");
      setPanel((prev) => ({
        ...prev,
        candidates: prev.candidates.map((item, itemIdx) =>
          itemIdx === idx ? { ...item, img: image } : item
        ),
      }));
    } catch (error) {
      showAlert(getErrorMessage(error, "Unable to upload image."));
    }
  };

  return (
    <div className="mb-4 rounded-3xl border border-slate-300 bg-slate-100 p-5 text-left shadow-inner sm:p-6">
      <div className="grid gap-5 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Panel Details
            </p>
            <div className="mt-4 grid gap-4">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-900"
                  htmlFor="panelName"
                >
                  Panel name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  name="panelName"
                  id="panelName"
                  value={panel.panelName}
                  placeholder="Panel name"
                  onChange={(e) =>
                    setPanel((prev) => ({ ...prev, panelName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-900"
                  htmlFor="panelImg"
                >
                  Panel image URL
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  name="panelImg"
                  id="panelImg"
                  value={panel.img}
                  placeholder="Panel image URL"
                  onChange={(e) =>
                    setPanel((prev) => ({ ...prev, img: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-900"
                  htmlFor="panelImgUpload"
                >
                  Upload panel image
                </label>
                <input
                  className="block w-full text-sm text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:font-semibold file:text-white"
                  id="panelImgUpload"
                  type="file"
                  accept="image/*"
                  onChange={onPanelImageUpload}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use either a direct image link or upload a file.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Panel Styling
          </p>
          <div className="mt-4 space-y-5">
            <ColorPicker
              label="Background"
              value={panel.panelColor}
              options={PANEL_COLOR_OPTIONS}
              onChange={(value) =>
                setPanel((prev) => ({ ...prev, panelColor: value }))
              }
            />
            <ColorPicker
              label="Text"
              value={panel.textColor}
              options={TEXT_COLOR_OPTIONS}
              onChange={(value) =>
                setPanel((prev) => ({ ...prev, textColor: value }))
              }
            />
          </div>
        </section>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Ballot Candidates
            </p>
            <h4 className="mt-2 text-lg font-semibold text-slate-900">
              Edit candidate rows
            </h4>
          </div>
          <button
            type="button"
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            onClick={onAddCandidate}
          >
            Add candidate
          </button>
        </div>

        <div className="space-y-4">
        {panel.candidates.map((candidate, idx) => (
          <div
            key={candidate.id ?? idx}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Candidate {idx + 1}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Ballot row {idx + 1}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  onClick={() => onMoveCandidate(idx, "up")}
                  disabled={idx === 0}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                  onClick={() => onMoveCandidate(idx, "down")}
                  disabled={idx === panel.candidates.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
                  onClick={() => onRemoveCandidate(idx)}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Role quick pick
                </label>
                <Dropdown className="w-full">
                  <Dropdown.Toggle
                    variant="light"
                    className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-slate-900"
                  >
                    {candidate.position || "Select role"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-full min-w-[220px] rounded-xl border border-slate-200 p-2 shadow-xl">
                    {POSITION_OPTIONS.map((position) => (
                      <Dropdown.Item
                        key={position}
                        active={candidate.position === position}
                        className="rounded-lg px-3 py-2 text-base"
                        onClick={() =>
                          setPanel((prev) => ({
                            ...prev,
                            candidates: prev.candidates.map((item, itemIdx) =>
                              itemIdx === idx
                                ? {
                                    ...item,
                                    position,
                                  }
                                : item
                            ),
                          }))
                        }
                      >
                        {position}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Role name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  value={candidate.position}
                  placeholder="Candidate role"
                  onChange={(e) =>
                    setPanel((prev) => ({
                      ...prev,
                      candidates: prev.candidates.map((item, itemIdx) =>
                        itemIdx === idx
                          ? { ...item, position: e.target.value }
                          : item
                      ),
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Candidate name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  value={candidate.name}
                  placeholder={`${candidate.position} candidate`}
                  onChange={(e) =>
                    setPanel((prev) => ({
                      ...prev,
                      candidates: prev.candidates.map((item, itemIdx) =>
                        itemIdx === idx ? { ...item, name: e.target.value } : item
                      ),
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Candidate image URL
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  value={candidate.img}
                  placeholder="Candidate image URL"
                  onChange={(e) =>
                    setPanel((prev) => ({
                      ...prev,
                      candidates: prev.candidates.map((item, itemIdx) =>
                        itemIdx === idx ? { ...item, img: e.target.value } : item
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Upload candidate image
              </label>
              <input
                className="block w-full text-sm text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:font-semibold file:text-white"
                type="file"
                accept="image/*"
                onChange={(event) => onCandidateImageUpload(event, idx)}
              />
              <p className="mt-2 text-xs text-slate-500">
                Use a link or upload a file. Leave blank to use the default
                candidate placeholder.
              </p>
            </div>
          </div>
        ))}
        </div>
      </div>

      <button
        className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
        type="button"
        onClick={onSubmitPanel}
      >
        {ctaText}
      </button>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 w-full">
      <label className="mb-2 block text-sm font-semibold text-slate-900">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => {
          const isActive = option.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={option}
              type="button"
              className={`h-10 w-10 rounded-full border-4 transition ${
                isActive ? "border-slate-900 scale-105" : "border-white"
              }`}
              style={{ backgroundColor: option }}
              onClick={() => onChange(option)}
              aria-label={`${label} ${option}`}
            />
          );
        })}
      </div>
      <input
        className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#000000"
      />
    </div>
  );
}
