"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { type Initiative } from "@/types/initiative";
import { type Session } from "next-auth";
import config from "@/lib/config/initiative.config";
import { isValidInitiativeData } from "@/lib/utils/initiatives";
import { trpc } from "@/lib/trpc/client";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/global/permission";
import { type FormStatus } from "@/types/global/status";
import Navbar from "@/components/ui/global/Navbar";
import CustomCursor from "@/components/ui/global/CustomCursor";
import MainWrapper from "@/components/ui/global/MainWrapper";
import { Button } from "@nextui-org/button";
import { Input, NextUIProvider, Spinner, Textarea } from "@nextui-org/react";

/**
 * Wraps the main components in a session provider for next auth.
 *
 * @returns JSX.Element
 */
export default function UpdateInitiativesPage(): JSX.Element {
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
 * The main components for the update initiatives page. These are to be wrapped in a
 * session provider for next auth.
 *
 * @returns JSX.Element
 */
function Components(): JSX.Element {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [initiative, setInitiative] = useState<Initiative | undefined>(
    undefined,
  );
  const [editStatus, setEditStatus] = useState<FormStatus>("idle");
  const [fetchStatus, setFetchStatus] = useState<FormStatus>("needs_fetch");
  const { mutateAsync: getInitiative } = trpc.getInitiative.useMutation();
  const { mutateAsync: updateInitiative } = trpc.updateInitiative.useMutation();

  /**
   * Get the initiative id from the url.
   */
  const path = usePathname();
  const initiativeId = path.split("/")[2];

  /**
   * Once the page loads, we want to fetch the initiative data so that we can
   * modify the existing initiative contents.
   */
  useEffect(() => {
    /**
     * If the initiative id is invalid or we are already fetching the initiative data,
     * then don't fetch the initiative data again.
     */
    if (!initiativeId || fetchStatus !== "needs_fetch") {
      return;
    }

    /**
     * Set the fetch status to loading so that we don't fetch the initiative again and
     * can display a loading screen to the user.
     */
    setFetchStatus("loading");

    /**
     * Fetch the initiative data from the database.
     */
    getInitiative({ id: initiativeId })
      .then((data) => {
        if (!data.initiative) {
          setFetchStatus("error");
          return;
        }

        setInitiative(data.initiative);
        setFetchStatus("success");
      })
      .catch(() => {
        setFetchStatus("error");
      });
  }, []);

  /**
   *
   * @param e The form initiative
   * @param initiative The initiative that the user is updating
   * @param session The current session (next auth)
   * @returns Promise<void>
   */
  async function onSubmit(
    e: FormEvent<HTMLFormElement>,
    initiative: Initiative,
    session: Session,
  ): Promise<void> {
    e.preventDefault();
    setEditStatus("loading");

    /**
     * If the provideed data for the initiative being created is invalid, then
     * return an error message. This is so that empty initiatives are not created.
     */
    if (!isValidInitiativeData(initiative)) {
      setEditStatus("empty_fields");

      return;
    }

    /**
     * Update the initiative in the database.
     */
    await updateInitiative({
      accessToken: session.user.secret,
      initiative,
    })
      .then(() => {
        setEditStatus("success");
        router.push("/");
      })
      .catch(() => {
        setEditStatus("error");
      });
  }

  /**
   * If the provided initiative id (from the url parameters) is invalid, then show an error message.
   */
  if (!initiativeId) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Initiative
        </h1>

        <div className="flex flex-col items-center justify-center gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            The initiative that you provided is invalid.
          </p>
          <Button className="btn" as={Link} color="primary" href="/">
            Go back
          </Button>
        </div>
      </MainWrapper>
    );
  }

  /**
   * If we are currently signing the user in, the initiative is invalid,
   * or we are still fetching the initiative data, show a loading screen.
   */
  if (
    !initiative ||
    sessionStatus === "loading" ||
    fetchStatus === "loading" ||
    editStatus === "loading"
  ) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center">
        <Spinner size="lg" color="primary" />
      </MainWrapper>
    );
  }

  /**
   * If the user is not signed in, then show an error message.
   */
  if (sessionStatus !== "authenticated") {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Session
        </h1>

        <div className="flex flex-col items-center justify-center gap-5">
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
   * If there was an error with fetching the initiative, show an error message.
   */
  if (fetchStatus === "error") {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Failed to fetch initiative
        </h1>

        <div className="flex flex-col items-center justify-center gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            There was an error fetching the initiative data.
          </p>
          <Button className="btn" as={Link} color="primary" href="/">
            Go back
          </Button>
        </div>
      </MainWrapper>
    );
  }

  /**
   * Check if the user has the permissions to edit a initiative.
   *
   * If the user does not have the permissions, then return an invalid permissions component.
   */
  if (!hasPermissions(session.user, [Permission.ADMIN])) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Permissions
        </h1>

        <div className="flex flex-col items-center justify-center gap-5">
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

  return (
    <MainWrapper className="flex min-h-screen w-screen flex-col items-start justify-start gap-5 p-10 pt-20 lg:p-20 lg:pt-44">
      <form
        className="flex w-full flex-col items-start justify-start gap-5"
        onSubmit={async (e) => onSubmit(e, initiative, session)}
      >
        <h1 className="mb-2 text-5xl font-normal uppercase text-white md:text-7xl">
          Update Initiative
        </h1>

        {/**
         * INITIATIVE NAME
         *
         * The user can set the name of the initiative. This will be displayed on the initiative page.
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
            value={initiative.name}
            onChange={(e) =>
              setInitiative({ ...initiative, name: e.target.value })
            }
          />
        </div>

        {/**
         * INITIATIVE DESCRIPTION
         *
         * The user can set the description of the initiative. This will be displayed on the initiative page.
         */}
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <label className="text-white">Initiative Description</label>
          <Textarea
            className="w-full"
            maxLength={config.initiative.max.description}
            minLength={config.initiative.min.description}
            label="Description"
            placeholder="Description"
            value={initiative.description}
            onChange={(e) =>
              setInitiative({ ...initiative, description: e.target.value })
            }
          />
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Button className="btn w-full" color="primary" type="submit">
            Update Initiative
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

      {editStatus === "success" && (
        <p className="text-primary">Initiative updated successfully.</p>
      )}

      {editStatus === "error" && (
        <p className="text-red-500">Failed to update initiative.</p>
      )}

      {editStatus === "empty_fields" && (
        <p className="text-red-500">Please fill in all fields.</p>
      )}
    </MainWrapper>
  );
}
