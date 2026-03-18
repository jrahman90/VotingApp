import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";

export const getAllCandidates = publicProcedure.query(async () => {
  try {
    const candidates = await prisma.candidate.findMany();

    return candidates;
  } catch (error) {
    console.log("🚀 ~ getAllCandidates ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});
