/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState } from "react";
import { PanelType } from "../../../server";
import { MdCreate, MdClear } from "react-icons/md";
import { PanelForm, PanelFormType } from "./PanelForm";
import { useUpdatePanel } from "../hooks/useUpdatePanel";

interface PaneListProps {
  data: PanelType[];
  selected: number;
  onClickPanel: (id: number) => void;
}

export default function PaneList({
  data,
  selected,
  onClickPanel,
}: PaneListProps) {
  return (
    <ul>
      {data.map((v) => {
        const isSelected = selected === v.id;
        return (
          <SinglePanel
            key={v.id}
            isSelected={isSelected}
            onClickPanel={onClickPanel}
            v={v}
          />
        );
      })}
    </ul>
  );
}

interface SinglePanelProps {
  v: PanelType;
  isSelected: boolean;
  onClickPanel: (id: number) => void;
}

const SinglePanel = ({ onClickPanel, isSelected, v }: SinglePanelProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const mutation = useUpdatePanel(() => setIsEdit(false));

  const onUpdate = (payload: PanelFormType) => {
    mutation.mutate({ ...payload, panelId: v.id });
  };
  return (
    <li
      className="text-center p-5 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded mb-5"
      key={v.id}
      onClick={() => onClickPanel(v.id)}
      style={{
        backgroundColor: v.panelColor,
      }}
    >
      <div className={`${isSelected ? "mb-4" : ""} flex row justify-center`}>
        {!isEdit ? (
          <>
            <p style={{ color: v.textColor }}>
              Voting # {v.votingId} {v.panelName}
            </p>
            <MdCreate
              size={20}
              className="cursor-pointer ml-8"
              color={v.textColor}
              onClick={(e) => {
                e.stopPropagation();
                setIsEdit(!isEdit);
              }}
            />
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* @ts-ignore */}
            <PanelForm data={v} ctaText="Update panel" onSubmit={onUpdate} />
            <MdClear
              size={20}
              className="cursor-pointer ml-8"
              color={v.textColor}
              onClick={(e) => {
                e.stopPropagation();
                setIsEdit(!isEdit);
              }}
            />
          </div>
        )}
      </div>
      {isSelected && (
        <div className="flex justify-center items-center">
          <img className="rounded w-20 h-20" src={v.img} />
        </div>
      )}
    </li>
  );
};
