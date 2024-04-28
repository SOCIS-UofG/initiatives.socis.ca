"use client";

import { type FormEvent, useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { type Session } from "next-auth";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/global/permission";
import { useRouter } from "next/navigation";
import { type Initiative } from "@/types/initiative";
import { isValidInitiativeData } from "@/lib/utils/initiatives";
import config from "@/lib/config/initiative.config";
import { trpc } from "@/lib/trpc/client";
import { type FormStatus } from "@/types/global/status";
import Navbar from "@/components/ui/global/Navbar";
import CustomCursor from "@/components/ui/global/CustomCursor";
import MainWrapper from "@/components/ui/global/MainWrapper";
import {
  Button,
  Input,
  NextUIProvider,
  Spinner,
  Textarea,
} from "@nextui-org/react";
import Link from "next/link";

/**
 * Wraps the main components in a session provider for next auth.
 *
 * @returns JSX.Element
 */
export default function InitiativeCreationPage(): JSX.Element {
  return (
    <NextUIProvider>
      <Navbar />
      <CustomCursor />

      <SessionProvider>
        <Components />
      </SessionProvider>
    </NextUIProvider>
  );
}

/**
 * The main components for the initiatives page. These are to be wrapped in a session provider
 * for next auth.
 *
 * @returns JSX.Element
 */
function Components(): JSX.Element {
  const { data: session, status: sessionStatus } = useSession();
  const { mutateAsync: createInitiative } = trpc.createInitiative.useMutation();
  const router = useRouter();

  const [creationStatus, setCreationStatus] = useState<FormStatus>("idle");
  const [initiative, setInitiative] = useState<Initiative>(
    config.initiative.default as Initiative,
  );

  /**
   * If the initiative is being created, the user is not authenticated, or the
   * default initiative hasn't been generated (undefined), then return a loading
   * screen.
   */
  if (sessionStatus === "loading" || creationStatus === "loading") {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center">
        <Spinner size="lg" color="primary" />
      </MainWrapper>
    );
  }

  /**
   * Check if the user is authenticated.
   *
   * If the user is not authenticated, then return an invalid session component.
   */
  if (sessionStatus === "unauthenticated" || !session) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Session
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            Please sign in to proceed.
          </p>

          <Button
            className="btn"
            as={Link}
            color="primary"
            href="https://auth.socis.ca/signin"
          >
            Sign in
          </Button>
        </div>
      </MainWrapper>
    );
  }

  /**
   * Check if the user has the permissions to create a initiative.
   *
   * If the user does not have the permissions, then return an invalid permissions component.
   */
  if (!hasPermissions(session.user, [Permission.ADMIN])) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Permissions
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            You do not have the permissions to manage initiatives.
          </p>

          <Button
            className="btn"
            as={Link}
            color="primary"
            href="https://auth.socis.ca/signin"
          >
            Switch accounts
          </Button>
        </div>
      </MainWrapper>
    );
  }

  /**
   * Handle the form submission.
   *
   * @param e The form initiative.
   * @param initiative The initiative to create.
   * @param session The session of the user editing the initiative
   * @returns Promise<void>
   */
  async function onSubmit(
    e: FormEvent<HTMLFormElement>,
    initiative: Initiative,
    session: Session,
  ): Promise<void> {
    /**
     * Prinitiative the default form submission.
     */
    e.preventDefault();

    /**
     * Set the status to loading so that the user knows that the initiative is being created.
     */
    setCreationStatus("loading");

    /**
     * If the provideed data for the initiative being created is invalid, then
     * return an error message. This is so that empty initiatives are not created.
     */
    if (!isValidInitiativeData(initiative)) {
      setCreationStatus("empty_fields");

      return;
    }

    /**
     * Create the initiative using the API.
     */
    await createInitiative({
      accessToken: session.user.secret,
      initiative,
    })
      .then(() => {
        setCreationStatus("success");
        router.push("/");
      })
      .catch(() => {
        setCreationStatus("error");
      });
  }

  /**
   * Return the main components for the initiatives page.
   */
  return (
    <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-start justify-start gap-5 p-10 pt-20 lg:p-20 lg:pt-44">
      <form
        className="flex w-full flex-col items-start justify-start gap-5"
        onSubmit={async (e) => onSubmit(e, initiative, session)}
      >
        {/** HEADER */}
        <h1 className="mb-2 text-5xl font-normal uppercase text-white md:text-7xl">
          Create Initiative
        </h1>

        {/**
         * INITIATIVE NAME
         *
         * The user can add a name to the initiative.
         * This will be displayed on the initiative page.
         */}
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <label className="text-white">Initiative Name</label>
          <Input
            className="w-full"
            maxLength={config.initiative.max.name}
            minLength={config.initiative.min.name}
            label="Name"
            placeholder="Name"
            type="text"
            onChange={(e) =>
              setInitiative({ ...initiative, name: e.target.value })
            }
          />
        </div>

        {/**
         * INITIATIVE DESCRIPTION
         *
         * The user can add a description to the initiative.
         * This will be displayed on the initiative page.
         */}
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <label className="text-white">Initiative Description</label>
          <Textarea
            className="w-full"
            maxLength={config.initiative.max.description}
            minLength={config.initiative.min.description}
            label="Description"
            placeholder="Description"
            onChange={(e) =>
              setInitiative({ ...initiative, description: e.target.value })
            }
          />
        </div>

        {/**
         * CREATE INITIATIVE
         *
         * The user can create the initiative using the form.
         */}
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <Button className="btn w-full" color="primary" type="submit">
            Create Initiative
          </Button>
          <Button
            className="btn w-full lg:w-1/2"
            as={Link}
            color="default"
            href="/"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/**
       * If the initiative was successfully created, then display a success message.
       *
       * This will appear before the user is redirected to the home page.
       */}
      {creationStatus === "success" && (
        <p className="text-primary">Initiative created successfully.</p>
      )}

      {/**
       * If the initiative was not successfully created, then display an error message.
       *
       * The user will have the chance to input the data again.
       */}
      {creationStatus === "error" && (
        <p className="text-red-500">Failed to create initiative.</p>
      )}

      {/**
       * If the user hasn't filled in all the fields, then display an error message.
       *
       * The user will have the chance to input the data again.
       */}
      {creationStatus === "empty_fields" && (
        <p className="text-red-500">Please fill in all fields.</p>
      )}
    </MainWrapper>
  );
}
