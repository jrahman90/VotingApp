import {
  createTRPCProxyClient,
  createTRPCReact,
  httpBatchLink,
} from "@trpc/react-query";
import type { AppRouter } from "../../../server/index";
import { QueryClient } from "@tanstack/react-query";
import { createWSClient, splitLink, wsLink } from "@trpc/client";

export const queryClient = new QueryClient();

export const TRPC_REACT = createTRPCReact<AppRouter>();

const httpUrl =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3001";

const wsUrl =
  import.meta.env.VITE_WS_URL?.trim() || "ws://localhost:3002";

const wsClient = createWSClient({
  url: wsUrl,
});

// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.
export const TRPC_PROXY_CLIENT = createTRPCProxyClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        return op.type === "subscription";
      },
      true: wsLink({
        client: wsClient,
      }),
      false: httpBatchLink({
        url: httpUrl,
      }),
    }),
  ],
});

export const TRPC_CLIENT = TRPC_REACT.createClient({
  links: [
    splitLink({
      condition(op) {
        return op.type === "subscription";
      },
      true: wsLink({
        client: wsClient,
      }),
      false: httpBatchLink({
        url: httpUrl,
        // You can pass any HTTP headers you wish here
        async headers() {
          return {
            authorization: undefined,
          };
        },
      }),
    }),
  ],
});

// TODO: EXAMPLES
// export const getUser = async (id: number) => {
//   return await TRPC_PROXY_CLIENT.userById.query(id);
// };
// export const createUser = async (payload: { name: string }) => {
//   return await TRPC_PROXY_CLIENT.userCreate.mutate(payload);
// };
