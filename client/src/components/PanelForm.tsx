import { useState } from "react";

const initialState = {
  img: "",
  panelColor: "",
  panelName: "",
  textColor: "",
  votingId: 0,
};

export type PanelFormType = typeof initialState;

interface PanelFormProps {
  ctaText: string;
  data?: PanelFormType;
  onSubmit: (payload: PanelFormType) => void;
}

export function PanelForm({ ctaText, data, onSubmit }: PanelFormProps) {
  const [panel, setPanel] = useState(data || initialState);

  const onSubmitPanel = () => {
    if (
      !panel.votingId ||
      !panel.img ||
      !panel.panelColor ||
      !panel.textColor ||
      !panel.panelName
    ) {
      alert("missing panel data");
      return;
    }
    onSubmit(panel);
    setPanel(initialState);
  };

  return (
    <div className="p-5 mb-4 rounded bg-zinc-200 flex flex-col justify-center items-center">
      <div>
        <input
          className="m-4"
          name="panelName"
          id="panelName"
          value={panel.panelName}
          placeholder="Panel name"
          onChange={(e) =>
            setPanel((prev) => ({ ...prev, panelName: e.target.value }))
          }
        />
        <label htmlFor="panelName">Name</label>
      </div>
      <div className="flex justify-center items-center mb-4">
        <input
          name="panelColor"
          id="panelColor"
          type="color"
          value={panel.panelColor}
          placeholder="Panel color"
          onChange={(e) =>
            setPanel((prev) => ({ ...prev, panelColor: e.target.value }))
          }
        />
        <label htmlFor="panelColor">Background</label>
      </div>
      <div className="flex justify-center items-center mb-4">
        <input
          name="panelTextColor"
          id="panelTextColor"
          type="color"
          value={panel.textColor}
          placeholder="Panel text color"
          onChange={(e) =>
            setPanel((prev) => ({ ...prev, textColor: e.target.value }))
          }
        />
        <label htmlFor="panelTextColor">Text</label>
      </div>
      <div>
        <input
          className="m-4"
          name="panelImg"
          id="panelImg"
          value={panel.img}
          placeholder="Panel img"
          onChange={(e) =>
            setPanel((prev) => ({ ...prev, img: e.target.value }))
          }
        />
        <label htmlFor="panelImg">Img url</label>
      </div>
      <div>
        <input
          className="m-4"
          name="panelVotingId"
          id="panelVotingId"
          value={panel.votingId}
          placeholder="Panel voting id"
          onChange={(e) =>
            setPanel((prev) => ({ ...prev, votingId: Number(e.target.value) }))
          }
        />
        <label htmlFor="panelVotingId">Voting Id</label>
      </div>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button"
        onClick={onSubmitPanel}
      >
        {ctaText}
      </button>
    </div>
  );
}
