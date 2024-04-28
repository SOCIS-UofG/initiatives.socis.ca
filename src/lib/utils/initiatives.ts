import { type Initiative } from "@/types/global/initiative";
import config from "@/lib/config/initiative.config";

/**
 * Check if a initiative is valid
 *
 * @param initiative The initiative to check
 * @returns Whether or not the initiative is valid
 */
export function isValidInitiativeData(initiative: Initiative): boolean {
  /**
   * Check if the initiative object is invalid
   *
   * For this to be invalid, the initiative must be:
   * - undefined
   */
  if (!initiative) {
    return false;
  }

  /**
   * Check if the initiative's name is invalid
   *
   * For this to be invalid, the initiative's name must be:
   * - empty string
   * - undefined
   * - longer than the max initiative name length
   * - shorter than the min initiative name length
   */
  if (
    !initiative.name ||
    initiative.name.length > config.initiative.max.name ||
    initiative.name.length < config.initiative.min.name
  ) {
    return false;
  }

  /**
   * Check if the initiative's description is invalid
   *
   * For this to be invalid, the initiative's description must be:
   * - empty string
   * - undefined
   * - longer than the max initiative description length
   * - shorter than the min initiative description length
   */
  if (
    !initiative.description ||
    initiative.description.length > config.initiative.max.description ||
    initiative.description.length < config.initiative.min.description
  ) {
    return false;
  }

  /**
   * Return true if the initiative is valid
   */
  return true;
}
