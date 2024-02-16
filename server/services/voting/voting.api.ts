import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";

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

export const createVoting = publicProcedure
  .input(z.object({ name: z.string() }))
  .mutation(async ({ input }) => {
    try {
      const voting = await prisma.voting.create({
        data: {
          name: input.name,
        },
      });

      return voting;
    } catch (error) {
      console.log("🚀 ~ createVoting ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const updateVoting = publicProcedure
  .input(z.object({ name: z.string(), votingId: z.number() }))
  .mutation(async ({ input }) => {
    try {
      const voting = await prisma.voting.update({
        where: {
          id: input.votingId,
        },
        data: {
          name: input.name,
        },
      });

      return voting;
    } catch (error) {
      console.log("🚀 ~ updateVoting ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });

export const getAll = publicProcedure.query(async () => {
  try {
    const votings = await prisma.voting.findMany();
    return votings;
  } catch (error) {
    console.log("🚀 ~ getAll ~ error:", error);

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
