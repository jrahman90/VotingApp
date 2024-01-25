import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";

export const getAllVotes = publicProcedure.query(async () => {
  try {
    const votes = await prisma.vote.findMany();

    return votes;
  } catch (error) {
    console.log("🚀 ~ getAllVotes ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const vote = publicProcedure
  .input(
    z.object({
      presidentId: z.number(),
      vicePresidentId: z.number(),
      secretaryId: z.number(),
      votingId: z.number(),
      deviceId: z.number(),
      voterId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const {
      deviceId,
      presidentId,
      secretaryId,
      vicePresidentId,
      voterId,
      votingId,
    } = input;
    const data = [
      {
        deviceId,
        voterId,
        votingId,
        candidateId: presidentId,
      },
      {
        deviceId,
        voterId,
        votingId,
        candidateId: secretaryId,
      },
      {
        deviceId,
        voterId,
        votingId,
        candidateId: vicePresidentId,
      },
    ];
    try {
      const votes = await prisma.vote.createMany({
        data,
      });
      return votes;
    } catch (error) {
      console.log("🚀 ~ vote ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });
