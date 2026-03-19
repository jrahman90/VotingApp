import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  assignVoterToDevice,
  approveDeviceSession,
  clearElectionVoters,
  createPanelRecord,
  createVotingRecord,
  createOperatorAccount,
  deletePanelRecord,
  deleteVotingRecord,
  getActiveVotingDetailed,
  getAllPanels,
  getAllVotings,
  getVoterById,
  getVotingById,
  getVotingRoster,
  getPublicResultsById,
  getAllStaffRecords,
  importManyVotersToElection,
  killDeviceSession,
  loginStaffWithFirebase,
  registerDeviceWithFirebase,
  resetElectionVotes,
  setActiveVotingRecord,
  submitVoteRecord,
  subscribeToConnectedDevices,
  unassignDevice,
  unregisterDeviceWithFirebase,
  reorderElectionCandidates,
  updateStaffAccess,
  updatePanelRecord,
  updateVotingRecord,
} from "./firebaseApi";

export const queryClient = new QueryClient();

const queryKeys = {
  votingAll: ["firebase", "voting", "all"] as const,
  votingOne: ["firebase", "voting", "one"] as const,
  votingDetailed: ["firebase", "voting", "detailed"] as const,
  votingById: (votingId?: number) => ["firebase", "voting", "byId", votingId] as const,
  votingRoster: (votingId?: number) =>
    ["firebase", "voting", "roster", votingId] as const,
  panelsAll: ["firebase", "panel", "all"] as const,
  voterById: (voterId?: number) => ["firebase", "voter", voterId] as const,
  devicesConnected: ["firebase", "devices", "connected"] as const,
  staffAll: ["firebase", "staff", "all"] as const,
};

function invalidateFirebaseQueries(queryClientValue: QueryClient) {
  return {
    voting: {
      getAll: {
        invalidate: () => queryClientValue.invalidateQueries({ queryKey: queryKeys.votingAll }),
      },
      getOne: {
        invalidate: () => queryClientValue.invalidateQueries({ queryKey: queryKeys.votingOne }),
      },
      getOneDetailed: {
        invalidate: () =>
          queryClientValue.invalidateQueries({ queryKey: queryKeys.votingDetailed }),
      },
      getById: {
        invalidate: (input?: { votingId?: number }) =>
          queryClientValue.invalidateQueries({
            queryKey: queryKeys.votingById(input?.votingId),
          }),
      },
      getRoster: {
        invalidate: (input?: { votingId?: number }) =>
          queryClientValue.invalidateQueries({
            queryKey: queryKeys.votingRoster(input?.votingId),
          }),
      },
    },
    panel: {
      getAll: {
        invalidate: () => queryClientValue.invalidateQueries({ queryKey: queryKeys.panelsAll }),
      },
    },
    voter: {
      getById: {
        invalidate: (input?: { voterId?: number }) =>
          queryClientValue.invalidateQueries({
            queryKey: queryKeys.voterById(input?.voterId),
          }),
      },
    },
    device: {
      getConnectedDevices: {
        invalidate: () =>
          queryClientValue.invalidateQueries({ queryKey: queryKeys.devicesConnected }),
      },
    },
    staff: {
      getAll: {
        invalidate: () => queryClientValue.invalidateQueries({ queryKey: queryKeys.staffAll }),
      },
    },
  };
}

export const TRPC_REACT = {
  useUtils() {
    const queryClientValue = useQueryClient();
    return invalidateFirebaseQueries(queryClientValue);
  },
  staff: {
    login: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: loginStaffWithFirebase,
          ...(options || {}),
        });
      },
    },
    getAll: {
      useQuery() {
        return useQuery({
          queryKey: queryKeys.staffAll,
          queryFn: getAllStaffRecords,
        });
      },
    },
    updateAccess: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        const queryClientValue = useQueryClient();
        return useMutation({
          mutationFn: updateStaffAccess,
          onSuccess(...args) {
            queryClientValue.invalidateQueries({ queryKey: queryKeys.staffAll });
            options?.onSuccess?.(...args as never);
          },
          ...(options || {}),
        });
      },
    },
    createOperator: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        const queryClientValue = useQueryClient();
        return useMutation({
          mutationFn: createOperatorAccount,
          onSuccess(...args) {
            queryClientValue.invalidateQueries({ queryKey: queryKeys.staffAll });
            options?.onSuccess?.(...args as never);
          },
          ...(options || {}),
        });
      },
    },
  },
  device: {
    register: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: registerDeviceWithFirebase,
          ...(options || {}),
        });
      },
    },
    unregister: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: unregisterDeviceWithFirebase,
          ...(options || {}),
        });
      },
    },
    killSession: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        const queryClientValue = useQueryClient();
        return useMutation({
          mutationFn: killDeviceSession,
          onSuccess(...args) {
            queryClientValue.invalidateQueries({ queryKey: queryKeys.devicesConnected });
            queryClientValue.invalidateQueries({ queryKey: ["firebase", "voting", "roster"] });
            queryClientValue.invalidateQueries({ queryKey: queryKeys.votingDetailed });
            options?.onSuccess?.(...args as never);
          },
          ...(options || {}),
        });
      },
    },
    assignVoter: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        const queryClientValue = useQueryClient();
        return useMutation({
          mutationFn: assignVoterToDevice,
          onSuccess(...args) {
            queryClientValue.invalidateQueries({ queryKey: queryKeys.devicesConnected });
            queryClientValue.invalidateQueries({ queryKey: ["firebase", "voting", "roster"] });
            queryClientValue.invalidateQueries({ queryKey: queryKeys.votingDetailed });
            options?.onSuccess?.(...args as never);
          },
          ...(options || {}),
        });
      },
    },
    approveSession: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        const queryClientValue = useQueryClient();
        return useMutation({
          mutationFn: approveDeviceSession,
          onSuccess(...args) {
            queryClientValue.invalidateQueries({ queryKey: queryKeys.devicesConnected });
            queryClientValue.invalidateQueries({ queryKey: queryKeys.votingDetailed });
            options?.onSuccess?.(...args as never);
          },
          ...(options || {}),
        });
      },
    },
    unassignVoter: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        const queryClientValue = useQueryClient();
        return useMutation({
          mutationFn: unassignDevice,
          onSuccess(...args) {
            queryClientValue.invalidateQueries({ queryKey: queryKeys.devicesConnected });
            queryClientValue.invalidateQueries({ queryKey: ["firebase", "voting", "roster"] });
            queryClientValue.invalidateQueries({ queryKey: queryKeys.votingDetailed });
            options?.onSuccess?.(...args as never);
          },
          ...(options || {}),
        });
      },
    },
    getConnectedDevices: {
      useSubscription(
        _input: undefined,
        handlers: {
          onData?: (data: unknown) => void;
          onError?: (error: Error) => void;
        }
      ) {
        const onDataRef = useRef(handlers.onData);
        const onErrorRef = useRef(handlers.onError);

        useEffect(() => {
          onDataRef.current = handlers.onData;
          onErrorRef.current = handlers.onError;
        }, [handlers.onData, handlers.onError]);

        useEffect(() => {
          const unsubscribe = subscribeToConnectedDevices(
            (devices) => onDataRef.current?.(devices),
            (error) => onErrorRef.current?.(error)
          );

          return () => unsubscribe();
        }, []);
      },
    },
  },
  voting: {
    getAll: {
      useQuery() {
        return useQuery({
          queryKey: queryKeys.votingAll,
          queryFn: getAllVotings,
        });
      },
    },
    getOne: {
      useQuery() {
        return useQuery({
          queryKey: queryKeys.votingOne,
          queryFn: getActiveVotingDetailed,
        });
      },
    },
    getOneDetailed: {
      useQuery(options?: { enabled?: boolean }) {
        return useQuery({
          queryKey: queryKeys.votingDetailed,
          queryFn: getActiveVotingDetailed,
          enabled: options?.enabled ?? true,
        });
      },
    },
    getById: {
      useQuery(input: { votingId: number }, options?: { enabled?: boolean }) {
        return useQuery({
          queryKey: queryKeys.votingById(input?.votingId),
          queryFn: () => getVotingById(input.votingId),
          enabled: options?.enabled ?? true,
        });
      },
    },
    getPublicResults: {
      useQuery(input: { votingId: number }, options?: { enabled?: boolean }) {
        return useQuery({
          queryKey: ["firebase", "voting", "publicResults", input?.votingId],
          queryFn: () => getPublicResultsById(input.votingId),
          enabled: options?.enabled ?? true,
          retry: false,
        });
      },
    },
    getRoster: {
      useQuery(input: { votingId: number }, options?: { enabled?: boolean }) {
        return useQuery({
          queryKey: queryKeys.votingRoster(input?.votingId),
          queryFn: () => getVotingRoster(input.votingId),
          enabled: options?.enabled ?? true,
          retry: false,
          staleTime: 0,
          refetchOnWindowFocus: true,
          refetchInterval: 5000,
        });
      },
    },
    create: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: createVotingRecord,
          ...(options || {}),
        });
      },
    },
    update: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: updateVotingRecord,
          ...(options || {}),
        });
      },
    },
    delete: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: deleteVotingRecord,
          ...(options || {}),
        });
      },
    },
    setActive: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: setActiveVotingRecord,
          ...(options || {}),
        });
      },
    },
    clearVoters: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: clearElectionVoters,
          ...(options || {}),
        });
      },
    },
    resetVotes: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: resetElectionVotes,
          ...(options || {}),
        });
      },
    },
  },
  panel: {
    getAll: {
      useQuery() {
        return useQuery({
          queryKey: queryKeys.panelsAll,
          queryFn: getAllPanels,
        });
      },
    },
    createPanel: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: createPanelRecord,
          ...(options || {}),
        });
      },
    },
    updatePanel: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: updatePanelRecord,
          ...(options || {}),
        });
      },
    },
    reorderCandidates: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: reorderElectionCandidates,
          ...(options || {}),
        });
      },
    },
    deletePanel: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: deletePanelRecord,
          ...(options || {}),
        });
      },
    },
  },
  voter: {
    getById: {
      useQuery(input: { voterId: number }, options?: { enabled?: boolean }) {
        return useQuery({
          queryKey: queryKeys.voterById(input?.voterId),
          queryFn: () => getVoterById(input.voterId),
          enabled: options?.enabled ?? true,
        });
      },
    },
    importMany: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        return useMutation({
          mutationFn: importManyVotersToElection,
          ...(options || {}),
        });
      },
    },
  },
  vote: {
    vote: {
      useMutation(options?: Parameters<typeof useMutation>[0]) {
        const queryClientValue = useQueryClient();
        return useMutation({
          mutationFn: submitVoteRecord,
          onSuccess(...args) {
            queryClientValue.invalidateQueries({ queryKey: queryKeys.votingDetailed });
            queryClientValue.invalidateQueries({ queryKey: ["firebase", "voting", "roster"] });
            queryClientValue.invalidateQueries({ queryKey: queryKeys.devicesConnected });
            options?.onSuccess?.(...args as never);
          },
          ...(options || {}),
        });
      },
    },
  },
} as const;

export const TRPC_CLIENT = null;
export const TRPC_PROXY_CLIENT = null;
