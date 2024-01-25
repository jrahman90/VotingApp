import { TRPCError } from "@trpc/server";
import { prisma } from "../../prisma/client";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
export const getAllStaff = publicProcedure.query(async () => {
  try {
    const staff = await prisma.staff.findMany();

    return staff;
  } catch (error) {
    console.log("🚀 ~ getAllStaff ~ error:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred, please try again later.",
      cause: error,
    });
  }
});

export const loginStaff = publicProcedure
  .input(
    z.object({
      email: z.string(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { email, password } = input;
    try {
      const staff = await prisma.staff.findUniqueOrThrow({
        where: {
          email,
        },
      });

      if (password !== staff.password) {
        throw new Error("Unauthorized");
      }

      return staff;
    } catch (error) {
      console.log("🚀 ~ loginStaff ~ error:", error);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred, please try again later.",
        cause: error,
      });
    }
  });
