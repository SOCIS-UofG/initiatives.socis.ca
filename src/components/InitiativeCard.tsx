import { cn } from "@/lib/utils/cn";
import { type Initiative } from "@/types/initiative";
import { type User } from "next-auth";
import InitiativeDeleteButton from "./InitiativeDeleteButton";
import InitiativeEditButton from "./InitiativeEditButton";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/permission";

/**
 * Props for the initiative card component.
 */
interface InitiativeCardProps {
  // Custom class name (styling)
  className?: string;

  // The user object. This will be used to determine whether to display
  // the edit/delete buttons.
  user?: User;

  // The initiative info
  initiative: Initiative;
}

/**
 * The initiative card component.
 *
 * @param props The props for the component.
 * @returns JSX.Element
 */
export default function InitiativeCard(
  props: InitiativeCardProps,
): JSX.Element {
  const CAN_MANAGE_INITIATIVES =
    props.user && hasPermissions(props.user, [Permission.ADMIN]);

  /**
   * Return the main component.
   */
  return (
    <div
      className={cn(
        "btn relative flex h-fit w-96 flex-col items-start justify-start rounded-lg border border-primary bg-secondary p-6 duration-300 ease-in-out",
        props.className,
      )}
    >
      {/**
       * INITIATIVE NAME
       *
       * The name of the initiative.
       */}
      <h1 className="text-3xl font-extrabold uppercase tracking-wider text-white">
        {props.initiative.name}
      </h1>

      {/**
       * INITIATIVE DESCRIPTION
       *
       * The description of the initiative.
       */}
      <p className="mt-1 line-clamp-3 h-7 w-full overflow-hidden text-sm font-thin text-white">
        {/**
         * Show an ellipsis if the description is too long.
         */}
        {props.initiative.description}
      </p>

      {/**
       * Edit and Delete buttons for the initiative.
       */}
      {props.user && CAN_MANAGE_INITIATIVES && (
        <div className="mt-4 flex h-fit w-full flex-row gap-2">
          <InitiativeEditButton initiative={props.initiative} />
          <InitiativeDeleteButton
            user={props.user}
            initiative={props.initiative}
          />
        </div>
      )}
    </div>
  );
}
