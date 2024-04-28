import { Prisma } from "@/lib/prisma";
import { publicProcedure } from "../trpc";
import { z } from "zod";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/global/permission";
import { type Initiative } from "@/types/initiative";
import config from "@/lib/config/initiative.config";
import { v4 as uuidv4 } from "uuid";

export const initiativesRouter = {
  /**
   * Add a initiative to the database
   *
   * @returns The new initiative
   */
  createInitiative: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        initiative: z.object({
          name: z
            .string()
            .max(config.initiative.max.name)
            .min(config.initiative.min.name),
          description: z
            .string()
            .max(config.initiative.max.description)
            .min(config.initiative.min.description),
          image: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await Prisma.getUserBySecretNoPassword(input.accessToken);
      if (!user) {
        throw new Error("Invalid access token");
      }

      if (!hasPermissions(user, [Permission.ADMIN])) {
        throw new Error("Invalid permissions");
      }

      const initiative = input.initiative as Initiative;
      const newInitiative = await Prisma.createInitiative({
        id: uuidv4(),
        name: initiative.name,
        description: initiative.description,
        image: initiative.image || config.initiative.default.image,
      } as Initiative);

      if (!newInitiative) {
        throw new Error("Failed to create initiative");
      }

      return { initiative: newInitiative };
    }),

  /**
   * Delete a initiative from the database
   *
   * @returns The deleted initiative
   */
  deleteInitiative: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await Prisma.getUserBySecretNoPassword(input.accessToken);
      if (!user) {
        throw new Error("Invalid access token");
      }

      if (!hasPermissions(user, [Permission.ADMIN])) {
        throw new Error("Invalid permissions");
      }

      const initiative = await Prisma.deleteInitiativeById(input.id);
      if (!initiative) {
        throw new Error("Failed to delete initiative");
      }

      return { initiative };
    }),

  /**
   * Update a initiative in the database
   *
   * @returns The updated initiative
   */
  updateInitiative: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        initiative: z.object({
          id: z.string(),
          name: z
            .string()
            .max(config.initiative.max.name)
            .min(config.initiative.min.name),
          description: z
            .string()
            .max(config.initiative.max.description)
            .min(config.initiative.min.description),
          image: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await Prisma.getUserBySecretNoPassword(input.accessToken);
      if (!user) {
        throw new Error("Invalid access token");
      }

      if (!hasPermissions(user, [Permission.ADMIN])) {
        throw new Error("Invalid permissions");
      }

      const initiative = input.initiative as Initiative;
      const updatedInitiative = await Prisma.updateInitiativeById(
        initiative.id,
        {
          name: initiative.name,
          description: initiative.description,
          image: initiative.image || config.initiative.default.image,
        } as Initiative,
      );

      if (!updatedInitiative) {
        throw new Error("Failed to update initiative");
      }

      return { initiative: updatedInitiative };
    }),

  /**
   * Get all of the initiatives
   *
   * @returns The initiatives
   */
  getAllInitiatives: publicProcedure.mutation(async () => {
    const initiatives = await Prisma.getAllInitiatives();

    return { initiatives };
  }),

  /**
   * Get a initiative by its id
   *
   * @returns The initiative
   */
  getInitiative: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const initiative = await Prisma.getInitiativeById(input.id);
      if (!initiative) {
        throw new Error("Failed to get initiative");
      }

      return { initiative };
    }),
};
