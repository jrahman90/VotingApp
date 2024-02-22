import { useState } from "react";
import { usePanels } from "../hooks/usePanels";
import { PanelType } from "../../../server";
import { useCreatePanel } from "../hooks/useCreatePanel";
import PaneList from "./PanelList";
import { PanelForm, PanelFormType } from "./PanelForm";

function PanelFormWrapper() {
  const mutation = useCreatePanel();

  const onCreatePanel = (payload: PanelFormType) => {
    mutation.mutate({ ...payload });
  };

  return <PanelForm ctaText="Create panel" onSubmit={onCreatePanel} />;
}

export default function Panels() {
  const { data, isError, isLoading } = usePanels();
  const [selected, setSelected] = useState<null | number>(null);

  const onClickPanel = (id: number) => {
    if (selected === id) {
      setSelected(null);
      return;
    }
    setSelected(id);
  };

  return (
    <div>
      {isLoading && (
        <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
          Loading panels...
        </p>
      )}
      {isError && (
        <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
          Error fetching panels
        </p>
      )}
      {data && (
        <>
          {data?.length === 0 && (
            <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
              No panels
            </p>
          )}
          {data?.length > 0 && (
            <>
              <PanelFormWrapper />
              <PaneList
                data={data as PanelType[]}
                onClickPanel={onClickPanel}
                selected={selected as number}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
