import { CandidateType } from "../../../server";
import { CandidatesList } from "../components/CandidatesList";
import { TRPC_REACT } from "../utils/trpc";

export function VotingPage() {
  const { data, isError, isLoading } =
    TRPC_REACT.voting.getOneDetailed.useQuery();
  const { data: candidates } = TRPC_REACT.candidate.getAll.useQuery();
  console.log("🚀 ~ App ~ candidates:", candidates);
  console.log("🚀 ~ App ~ data:", data);

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
          </div>
          <CandidatesList
            panels={data?.Panels || []}
            candidates={candidates as unknown as CandidateType[]}
          />
        </div>
      )}
    </div>
  );
}
