import { TRPC_REACT } from "../utils/trpc";
import { useAppAlert } from "../utils/alerts";

export const useUpdatePanel = (cb?: () => void) => {
  const ctx = TRPC_REACT.useUtils();
  const { showAlert } = useAppAlert();

  return TRPC_REACT.panel.updatePanel.useMutation({
    onError(error) {
      console.log("🚀 ~ onError ~ error:", error);
      showAlert(error.message);
    },
    onSuccess(data) {
      console.log("🚀 ~ onSuccess ~ data:", data);
      ctx.voting.getAll.invalidate();
      ctx.panel.getAll.invalidate();
      cb?.();
    },
  });
};
