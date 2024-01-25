import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";

export const getAllVoters = publicProcedure.query(async () => {
  try {
    const voter = await prisma.voter.findMany();

    return voter;
  } catch (error) {
    console.log("🚀 ~ getAllVoters ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});
