import { router } from "../../trpc";
import { getAllPanels, getByVotingId } from "./panel.api";

export const panelRouter = router({
  getAll: getAllPanels,
  getByVotingId: getByVotingId,
});
