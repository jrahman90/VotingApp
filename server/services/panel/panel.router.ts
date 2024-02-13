import { router } from "../../trpc";
import {
  getAllPanels,
  getByVotingId,
  createPanel,
  updatePanel,
} from "./panel.api";

export const panelRouter = router({
  getAll: getAllPanels,
  getByVotingId: getByVotingId,
  createPanel,
  updatePanel,
});
