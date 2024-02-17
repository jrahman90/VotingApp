import { useState } from "react";
import { PanelType, VotingType } from "../../../server";
import { MdCreate, MdClear } from "react-icons/md";
import { useUpdateVoting } from "../hooks/useUpdateVoting";

interface VotingsListProps {
  data: VotingType[];
  panels: PanelType[];
  selected: number;
  onClickVoting: (id: number) => void;
}

export default function VotingsList({
  data,
  panels,
  selected,
  onClickVoting,
}: VotingsListProps) {
  return (
    <ul>
      {data.map((v) => {
        const votingPanels = panels?.filter((p) => p.votingId === v.id) || [];
        const isSelected = selected === v.id;
        return (
          <SingleVoting
            key={v.id}
            isSelected={isSelected}
            onClickVoting={onClickVoting}
            v={v}
            votingPanels={votingPanels}
          />
        );
      })}
    </ul>
  );
}

interface SingleVotingProps {
  v: VotingType;
  votingPanels: PanelType[];
  isSelected: boolean;
  onClickVoting: (id: number) => void;
}

const SingleVoting = ({
  onClickVoting,
  votingPanels,
  isSelected,
  v,
}: SingleVotingProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState(v.name);
  const mutation = useUpdateVoting(() => setIsEdit(false));

  const onUpdate = () => {
    if (!name) {
      alert("missing name");
      return;
    }
    mutation.mutate({ name, votingId: v.id });
  };
  return (
    <li
      className="text-center p-5 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded mb-5"
      key={v.id}
      onClick={() => onClickVoting(v.id)}
    >
      <div className={`${isSelected ? "mb-4" : ""} flex row justify-center`}>
        {!isEdit ? (
          <>
            <p>{v.name}</p>
            <MdCreate
              size={20}
              className="cursor-pointer ml-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsEdit(!isEdit);
              }}
            />
          </>
        ) : (
          <div
            className="flex flex-row items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              name="votingName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-8"
              type="button"
              onClick={onUpdate}
            >
              Update
            </button>
            <MdClear
              size={20}
              className="cursor-pointer ml-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsEdit(!isEdit);
              }}
            />
          </div>
        )}
      </div>
      {isSelected &&
        votingPanels?.map((p) => (
          <p
            key={p.id}
            className="mb-4 p-4"
            style={{
              color: p.textColor,
              backgroundColor: p.panelColor,
            }}
          >
            {p.panelName}
          </p>
        ))}
    </li>
  );
};
