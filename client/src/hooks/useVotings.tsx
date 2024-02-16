import { TRPC_REACT } from "../utils/trpc";

export const useVotings = () => {
  const { data, isError, isLoading } = TRPC_REACT.voting.getAll.useQuery();
  return { data, isError, isLoading };
};
