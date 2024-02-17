import { useState } from "react";
import { usePanels } from "../hooks/usePanels";
import { useVotings } from "../hooks/useVotings";
import { useCreateVoting } from "../hooks/useCreateVoting";
import VotingsList from "./VotingsList";
import { PanelType, VotingType } from "../../../server";

function VotingForm() {
  const [votingName, setVotingName] = useState("");
  const mutation = useCreateVoting(() => setVotingName(""));

  const onCreateVoting = () => {
    if (!votingName) {
      alert("missing voting name");
      return;
    }
    mutation.mutate({ name: votingName });
  };

  return (
    <div className="p-5 mb-4 rounded bg-zinc-200 flex justify-center items-center">
      <p>Add new voting</p>
      <input
        className="mx-4"
        name="votingName"
        value={votingName}
        placeholder="Name"
        onChange={(e) => setVotingName(e.target.value)}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button"
        onClick={onCreateVoting}
      >
        Create voting
      </button>
    </div>
  );
}

export default function Votings() {
  const { data, isError, isLoading } = useVotings();
  const { data: panels } = usePanels();
  const [selected, setSelected] = useState<null | number>(null);

  const onClickVoting = (id: number) => {
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
          Loading votings...
        </p>
      )}
      {isError && (
        <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
          Error fetching votings
        </p>
      )}
      {data && (
        <>
          {data?.length === 0 && (
            <p className="my-20 line-clamp-3 text-lg text-center leading-6 text-gray-600 font-bold">
              No votings
            </p>
          )}
          {data?.length > 0 && (
            <>
              <VotingForm />
              <VotingsList
                data={data as VotingType[]}
                onClickVoting={onClickVoting}
                panels={panels as PanelType[]}
                selected={selected as number}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
