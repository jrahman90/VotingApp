import { router } from "../../trpc";
import { getAllStaff, loginStaff } from "./staff.api";

export const staffRouter = router({
  getAll: getAllStaff,
  login: loginStaff,
});
