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
import {
  Button,
  CustomCursor,
  ErrorMessage,
  LinkButton,
  LoadingSpinnerCenter,
  MainWrapper,
  Navbar,
  SuccessMessage,
} from "socis-components";
import { trpc } from "@/lib/trpc/client";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/permission";

/**
 * The status of the form.
 */
enum FormStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
  EMPTY_FIELDS,
  NEED_FETCH,
}

/**
 * Wraps the main components in a session provider for next auth.
 *
 * @returns JSX.Element
 */
export default function UpdateInitiativesPage(): JSX.Element {
  return (
    <>
      <Navbar />
      <CustomCursor />

      <SessionProvider>
        <Components />
      </SessionProvider>
    </>
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
  const [editStatus, setEditStatus] = useState(FormStatus.IDLE);
  const [fetchStatus, setFetchStatus] = useState(FormStatus.NEED_FETCH);
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
    if (!initiativeId || fetchStatus !== FormStatus.NEED_FETCH) {
      return;
    }

    /**
     * Set the fetch status to loading so that we don't fetch the initiative again and
     * can display a loading screen to the user.
     */
    setFetchStatus(FormStatus.LOADING);

    /**
     * Fetch the initiative data from the database.
     */
    getInitiative({ id: initiativeId })
      .then((data) => {
        if (!data.initiative) {
          setFetchStatus(FormStatus.ERROR);
          return;
        }

        setInitiative(data.initiative);
        setFetchStatus(FormStatus.SUCCESS);
      })
      .catch(() => {
        setFetchStatus(FormStatus.ERROR);
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
    setEditStatus(FormStatus.LOADING);

    /**
     * If the provideed data for the initiative being created is invalid, then
     * return an error message. This is so that empty initiatives are not created.
     */
    if (!isValidInitiativeData(initiative)) {
      setEditStatus(FormStatus.EMPTY_FIELDS);

      return;
    }

    /**
     * Update the initiative in the database.
     */
    const res = await updateInitiative({
      accessToken: session.user.secret,
      initiative,
    });

    /**
     * If the initiative was successfully updated, then set the status to success.
     */
    if (res.success) {
      setEditStatus(FormStatus.SUCCESS);

      router.push("/");
    }
  }

  /**
   * If the provided initiative id (from the url parameters) is invalid, then show an error message.
   */
  if (!initiativeId) {
    return (
      <MainWrapper>
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Initiative
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            The initiative that you provided is invalid.
          </p>
          <Link
            href="/"
            className="rounded-lg border border-primary px-10 py-3 text-center font-thin text-white hover:bg-emerald-900/50"
          >
            Go back
          </Link>
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
    fetchStatus === FormStatus.LOADING ||
    editStatus === FormStatus.LOADING
  ) {
    return <LoadingSpinnerCenter />;
  }

  /**
   * If the user is not signed in, then show an error message.
   */
  if (sessionStatus !== "authenticated") {
    return (
      <MainWrapper>
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Session
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            Please sign in to proceed.
          </p>
          <a
            href="https://auth.socis.ca/signin"
            className="rounded-lg border border-primary px-10 py-3 text-center font-thin text-white hover:bg-emerald-900/50"
          >
            Sign in
          </a>
        </div>
      </MainWrapper>
    );
  }

  /**
   * If there was an error with fetching the initiative, show an error message.
   */
  if (fetchStatus === FormStatus.ERROR) {
    return (
      <MainWrapper>
        <ErrorMessage>
          There was an error fetching the initiative. Please try again later.
        </ErrorMessage>
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
      <MainWrapper>
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Permissions
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            You do not have the permissions to manage initiatives.
          </p>
          <a
            href="https://auth.socis.ca/signin"
            className="rounded-lg border border-primary px-10 py-3 text-center font-thin text-white hover:bg-emerald-900/50"
          >
            Switch accounts
          </a>
        </div>
      </MainWrapper>
    );
  }

  return (
    <MainWrapper className="p-10 pt-20 lg:p-20 lg:pt-44">
      <form
        className="flex w-full flex-col"
        onSubmit={async (e) => onSubmit(e, initiative, session)}
      >
        <h1 className="mb-7 text-5xl font-thin uppercase text-white md:text-7xl">
          Update Initiative
        </h1>

        {/**
         * INITIATIVE NAME
         *
         * The user can set the name of the initiative. This will be displayed on the initiative page.
         */}
        <label className="mb-2 text-white">Initiative Name</label>
        <input
          className="rounded-lg border border-primary bg-secondary px-4 py-3 text-base font-thin tracking-wider text-white duration-300 ease-in-out focus:outline-none disabled:opacity-50"
          maxLength={config.initiative.max.name}
          minLength={config.initiative.min.name}
          placeholder="Name"
          type="text"
          value={initiative.name}
          onChange={(e) =>
            setInitiative({ ...initiative, name: e.target.value })
          }
        />

        {/**
         * INITIATIVE DESCRIPTION
         *
         * The user can set the description of the initiative. This will be displayed on the initiative page.
         */}
        <label className="mb-2 mt-5 text-white">Initiative Description</label>
        <textarea
          className="rounded-lg border border-primary bg-secondary px-4 py-3 text-base font-thin tracking-wider text-white duration-300 ease-in-out focus:outline-none disabled:opacity-50"
          maxLength={config.initiative.max.description}
          minLength={config.initiative.min.description}
          placeholder="Description"
          value={initiative.description}
          onChange={(e) =>
            setInitiative({ ...initiative, description: e.target.value })
          }
        />

        <Button type="submit">Update Initiative</Button>
        <LinkButton href="/">Cancel</LinkButton>
      </form>

      {editStatus === FormStatus.SUCCESS && (
        <SuccessMessage>
          <p>Initiative updated successfully!</p>
        </SuccessMessage>
      )}

      {editStatus === FormStatus.ERROR && (
        <ErrorMessage>
          <p>There was an error creating your initiative.</p>
        </ErrorMessage>
      )}

      {editStatus === FormStatus.EMPTY_FIELDS && (
        <ErrorMessage>
          <p>Make sure all fields are filled in.</p>
        </ErrorMessage>
      )}
    </MainWrapper>
  );
}
