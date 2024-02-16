import { TRPC_REACT } from "../utils/trpc";

export const useCreateVoting = (cb?: () => void) => {
  const ctx = TRPC_REACT.useUtils();

  return TRPC_REACT.voting.create.useMutation({
    onError(error) {
      console.log("🚀 ~ onError ~ error:", error);
      alert(
        JSON.stringify({
          msg: error.message,
          code: error.data?.code,
          status: error.data?.httpStatus,
        })
      );
    },
    onSuccess(data) {
      console.log("🚀 ~ onSuccess ~ data:", data);
      ctx.voting.getAll.invalidate();
      cb?.();
    },
  });
};
