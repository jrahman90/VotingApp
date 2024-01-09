import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";

export const getOneVoting = publicProcedure.query(async () => {
  try {
    const voting = await prisma.voting.findFirst();

    return voting;
  } catch (error) {
    console.log("🚀 ~ getOneVoting ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const getOneVotingDetailed = publicProcedure.query(async () => {
  try {
    const voting = await prisma.voting.findFirst({
      include: {
        Panels: {
          include: {
            Candidates: true,
          },
        },
      },
    });

    return voting;
  } catch (error) {
    console.log("🚀 ~ getOneVoting ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});
