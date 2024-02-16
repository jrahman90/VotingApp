import { TRPC_REACT } from "../utils/trpc";

export const usePanels = () => {
  const { data, isError, isLoading } = TRPC_REACT.panel.getAll.useQuery();
  return { data, isError, isLoading };
};
