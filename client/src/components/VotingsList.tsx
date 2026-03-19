import { ChangeEvent, useState } from "react";
import { MdCreate, MdClear, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { useUpdateVoting } from "../hooks/useUpdateVoting";
import { TRPC_REACT } from "../utils/trpc";
import { uploadImageFile } from "../utils/images";
import { getErrorMessage, useAppAlert } from "../utils/alerts";

interface VotingRecord {
  id: number;
  name: string;
  img: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VotingsListProps {
  data: VotingRecord[];
  selected: number;
  onClickVoting: (id: number) => void;
}

export default function VotingsList({
  data,
  selected,
  onClickVoting,
}: VotingsListProps) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((v) => {
        const isSelected = selected === v.id;
        return (
          <SingleVoting
            key={v.id}
            isSelected={isSelected}
            onClickVoting={onClickVoting}
            v={v}
          />
        );
      })}
    </ul>
  );
}

interface SingleVotingProps {
  v: VotingRecord;
  isSelected: boolean;
  onClickVoting: (id: number) => void;
}

const SingleVoting = ({
  onClickVoting,
  isSelected,
  v,
}: SingleVotingProps) => {
  const { showAlert, showConfirmAlert } = useAppAlert();
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState(v.name);
  const [img, setImg] = useState(v.img);
  const mutation = useUpdateVoting(() => setIsEdit(false));
  const utils = TRPC_REACT.useUtils();
  const setActiveMutation = TRPC_REACT.voting.setActive.useMutation({
    onSuccess() {
      utils.voting.getAll.invalidate();
      utils.voting.getOne.invalidate();
      utils.voting.getOneDetailed.invalidate();
    },
    onError(error) {
      showAlert(error.message);
    },
  });
  const deleteMutation = TRPC_REACT.voting.delete.useMutation({
    onSuccess() {
      utils.voting.getAll.invalidate();
      utils.voting.getOne.invalidate();
      utils.voting.getOneDetailed.invalidate();
    },
    onError(error) {
      showAlert(error.message);
    },
  });

  const onUpdate = () => {
    if (!name) {
      showAlert("Missing election name", "warning");
      return;
    }
    mutation.mutate({ name, img, votingId: v.id });
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
      setImg(image);
    } catch (error) {
      showAlert(getErrorMessage(error, "Unable to upload image."));
    }
  };

  const onDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    showConfirmAlert(
      `Delete "${v.name}" and all of its panels, assigned voters, and results?`,
      [
        {
          label: "Cancel",
          variant: "secondary",
          onClick: () => undefined,
        },
        {
          label: "Delete election",
          variant: "danger",
          onClick: () => deleteMutation.mutate({ votingId: v.id }),
        },
      ]
    );
  };
  return (
    <li
      className={`cursor-pointer rounded-3xl border p-4 shadow-sm transition-all ${
        isSelected
          ? "border-blue-300 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
      key={v.id}
      onClick={() => onClickVoting(v.id)}
    >
      <div className={`${isSelected ? "mb-4" : ""} flex items-start gap-4`}>
        {!isEdit ? (
          <>
            <img
              src={v.img}
              alt={v.name}
              className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
            />
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold text-slate-900">
                  {v.name}
                </p>
                {v.isActive && (
                  <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-semibold text-green-900">
                    Active election
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {isSelected ? "Open election settings" : "Tap to open"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              {isSelected ? (
                <MdKeyboardArrowUp size={24} />
              ) : (
                <MdKeyboardArrowDown size={24} />
              )}
              <MdCreate
                size={20}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEdit(!isEdit);
                }}
              />
            </div>
          </>
        ) : (
          <div
            className="flex w-full flex-col rounded-2xl bg-slate-100 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className="mb-3 rounded border border-slate-300 px-3 py-2"
              name="votingName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="mb-3 w-full rounded border border-slate-300 px-3 py-2"
              name="votingImg"
              value={img}
              placeholder="Election image URL"
              onChange={(e) => setImg(e.target.value)}
            />
            <input
              className="mb-3 w-full"
              type="file"
              accept="image/*"
              onChange={onElectionImageUpload}
            />
            <div className="flex items-center gap-3">
              <button
                className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                type="button"
                onClick={onUpdate}
              >
                Update
              </button>
              <MdClear
                size={20}
                className="cursor-pointer text-slate-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEdit(!isEdit);
                }}
              />
            </div>
          </div>
        )}
      </div>
      {isSelected && !isEdit && !v.isActive && (
        <div className="mb-3">
          <button
            type="button"
            className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMutation.mutate({ votingId: v.id });
            }}
          >
            Set as active election
          </button>
        </div>
      )}
      {isSelected && !isEdit && (
        <div>
          <button
            type="button"
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
            onClick={onDelete}
          >
            Delete election
          </button>
        </div>
      )}
    </li>
  );
};
