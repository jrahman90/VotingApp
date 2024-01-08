import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { router, publicProcedure } from "./trpc";

const users = [
  {
    id: 1,
    name: "sebas",
  },
  {
    id: 2,
    name: "peter",
  },
];

const appRouter = router({
  userList: publicProcedure.query(async () => {
    return users;
  }),
  userById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const user = users.find((u) => u.id === input);
    return user;
  }),

  userCreate: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      // Create a new user in the database
      const user = { ...input, id: users.length };
      users.push(user);
      return user;
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000);
