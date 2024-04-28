import { cn } from "@/lib/utils/cn";
import { type Initiative } from "@/types/global/initiative";
import { type User } from "next-auth";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/global/permission";
import { Button } from "@nextui-org/button";
import { trpc } from "@/lib/trpc/client";
import { useState, type DetailedHTMLProps, type HTMLAttributes } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/modal";
import { Spinner } from "@nextui-org/spinner";
import { type Status } from "@/types/global/status";
import Link from "next/link";
import Grid from "./global/Grid";

// react fa icon Rocket
import { FaRocket } from "react-icons/fa";

/**
 * Props for the initiative card component.
 */
type InitiativeCardProps = {
  // The user object. This will be used to determine whether to display
  // the edit/delete buttons.
  user?: User;

  // The initiative info
  initiative: Initiative;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

/**
 * The initiative card component.
 *
 * @param props The props for the component.
 * @returns JSX.Element
 */
export default function InitiativeCard(
  props: InitiativeCardProps,
): JSX.Element {
  const { mutateAsync: deleteInitiative } = trpc.deleteInitiative.useMutation();
  const { onOpen, onClose, isOpen, onOpenChange } = useDisclosure();
  const [status, setStatus] = useState<Status>("idle");

  const CAN_MANAGE_INITIATIVES =
    props.user && hasPermissions(props.user, [Permission.ADMIN]);

  /**
   * Return the main component.
   */
  return (
    <>
      <div
        className={cn(
          "btn relative flex h-fit w-full max-w-96 flex-col items-start justify-start rounded-xl border border-neutral-700/60 bg-secondary duration-300 ease-in-out sm:w-96",
          props.className,
        )}
      >
        <div className="relative flex h-32 w-full flex-col items-center justify-center overflow-hidden border-b border-b-neutral-700/60">
          {/** Dark overlay */}
          <div className="absolute left-0 top-0 h-full w-full rounded-t-xl bg-black/30" />

          <Grid className="absolute left-0 top-0 w-full" />
          <FaRocket className="h-7 w-7 text-white" />
        </div>

        <div className="flex w-full flex-col gap-2 p-6">
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
          <p className="mt-1 line-clamp-3 h-12 w-full overflow-hidden text-sm font-thin text-white">
            {/**
             * Show an ellipsis if the description is too long.
             */}
            {props.initiative.description}
          </p>

          {/**
           * Edit and Delete buttons for the initiative.
           */}
          {props.user && CAN_MANAGE_INITIATIVES && (
            <div className="mt-2 flex h-fit w-full flex-row gap-2">
              <Button
                as={Link}
                color="default"
                size="sm"
                variant="bordered"
                href={`/edit/${props.initiative.id}`}
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant="bordered"
                color="danger"
                className="w-fit"
                onClick={onOpen}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/**
       * DELETE INITIATIVE MODAL
       *
       * The modal for deleting the initiative.
       */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
        <ModalContent>
          <ModalHeader>Delete Initiative</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the initiative{" "}
              <strong>{props.initiative.name}</strong>? This action cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              className="btn"
              disabled={status === "loading"}
              color="danger"
              onClick={async () => {
                if (!props.user) {
                  return;
                }

                setStatus("loading");

                await deleteInitiative({
                  id: props.initiative.id,
                  accessToken: props.user.secret,
                })
                  .then(() => {
                    setStatus("success");
                  })
                  .catch(() => {
                    setStatus("error");
                  });

                setStatus("success");

                onClose();
              }}
            >
              {status === "loading" ? (
                <Spinner size="sm" color="white" />
              ) : (
                "Delete"
              )}
            </Button>
            <Button
              className="btn"
              color="default"
              onClick={onClose}
              disabled={status === "loading"}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
