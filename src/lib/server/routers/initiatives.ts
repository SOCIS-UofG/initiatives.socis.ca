import { Prisma } from "@/lib/prisma";
import { publicProcedure } from "../trpc";
import { z } from "zod";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/permission";
import { type Initiative } from "@/types/initiative";
import config from "@/lib/config/initiative.config";
import { v4 as uuidv4 } from "uuid";

export const initiativesRouter = {
  /**
   * Add a initiative to the database
   *
   * @param input - The input object
   * @param input.initiative - The initiative to add
   */
  createInitiative: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        initiative: z.object({
          id: z.string().optional(),
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
        return { success: false, initiative: null };
      }

      if (!hasPermissions(user, [Permission.ADMIN])) {
        return { success: false, initiative: null };
      }

      const initiative = input.initiative as Initiative;
      const generatedId = initiative.id || uuidv4();
      const newInitiative = await Prisma.createInitiative({
        id: generatedId,
        name: initiative.name,
        description: initiative.description,
        image: initiative.image || config.initiative.default.image,
      } as Initiative);

      if (!newInitiative) {
        return { success: false, initiative: null };
      }

      return { success: true, initiative: newInitiative };
    }),

  /**
   * Delete a initiative from the database
   *
   * @param input - The input object
   * @param input.id - The id of the initiative to delete
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
        return { success: false, initiative: null };
      }

      if (!hasPermissions(user, [Permission.ADMIN])) {
        return { success: false, initiative: null };
      }

      const initiative = await Prisma.deleteInitiativeById(input.id);
      if (!initiative) {
        return { success: false, initiative: null };
      }

      return { success: true, initiative };
    }),

  /**
   * Update a initiative in the database
   *
   * @param input - The input object
   * @param input.initiative - The initiative to update
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
        return { success: false, initiative: null };
      }

      if (!hasPermissions(user, [Permission.ADMIN])) {
        return { success: false, initiative: null };
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
        return { success: false, initiative: null };
      }

      return { success: true, initiative: updatedInitiative };
    }),

  /**
   * Get all of the initiatives
   *
   * @returns The initiatives
   */
  getAllInitiatives: publicProcedure.mutation(async () => {
    const initiatives = await Prisma.getAllInitiatives();

    return { success: true, initiatives };
  }),

  /**
   * Get a initiative by its id
   *
   * @param input - The input object
   * @param input.id - The id of the initiative to get
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
        return { success: false, initiative: null };
      }

      return { success: true, initiative };
    }),
};
