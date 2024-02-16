import { useState } from "react";
import { usePanels } from "../hooks/usePanels";
import { useVotings } from "../hooks/useVotings";
import { useCreateVoting } from "../hooks/useCreateVoting";

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
              <ul>
                {data.map((v) => {
                  const votingPanels =
                    panels?.filter((p) => p.votingId === v.id) || [];
                  const isSelected = selected === v.id;
                  return (
                    <li
                      className="text-center p-5 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded mb-5"
                      key={v.id}
                      onClick={() => onClickVoting(v.id)}
                    >
                      <p className={isSelected ? "mb-4" : ""}>{v.name}</p>
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
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
