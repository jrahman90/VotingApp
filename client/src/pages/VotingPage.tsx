import { useState } from "react";
import { CandidateType } from "../../../server";
import { CandidatesList } from "../components/CandidatesList";
import { TRPC_REACT } from "../utils/trpc";
import React from "react";

const initialState = {
  President: 0,
  VicePresident: 0,
  Secretary: 0,
};

interface VotingPageProps {
  device: string;
  voterId: number;
}

export function VotingPage({ device, voterId }: VotingPageProps) {
  const { data, isError, isLoading } =
    TRPC_REACT.voting.getOneDetailed.useQuery();
  const { data: candidates } = TRPC_REACT.candidate.getAll.useQuery();

  const [selection, setSelection] = useState(initialState);

  const isEnabled = !!voterId;

  const onVote = () => {
    if (
      selection["President"] === 0 ||
      selection["VicePresident"] === 0 ||
      selection["Secretary"] === 0
    ) {
      alert("You must select one candidate for all the positions");
      return;
    }
    console.log("🚀 ~ VotingPage ~ selection:", selection);
  };
  const onClear = () => {
    setSelection(initialState);
  };
  const onSelection = (id: number, position: string) => {
    setSelection({ ...selection, [position]: id });
  };

  return (
    <div className="bg-white py-12 sm:py-14">
      {isLoading && (
        <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 text-center">
          loading...
        </p>
      )}
      {isError && (
        <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600 text-center">
          error while fetching the data
        </p>
      )}
      {!isError && !isLoading && (
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {data?.name}
            </h1>
            <p className="tracking-tight text-gray-900 mt-3">
              Device: {device}
            </p>
            <p className="tracking-tight text-gray-900">Voter#: {voterId}</p>
          </div>
          {!isEnabled && (
            <div className="mx-auto mt-10 max-w-2xl border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none">
              <p className="tracking-tight text-gray-900 text-center">
                Device not enabled. Please identify with your voter #
              </p>
            </div>
          )}
          {isEnabled && (
            <React.Fragment>
              <CandidatesList
                panels={data?.Panels || []}
                candidates={candidates as unknown as CandidateType[]}
                selection={selection}
                setSelection={onSelection}
              />
              <div className="w-full flex justify-center my-20">
                <button
                  className="bg-slate-200 hover:bg-slate-400 text-black font-bold py-2 px-4 rounded mr-4"
                  onClick={onClear}
                >
                  Clear
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={onVote}
                >
                  Vote
                </button>
              </div>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}
