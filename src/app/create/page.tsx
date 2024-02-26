"use client";

import { type FormEvent, useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { type Session } from "next-auth";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission } from "@/types/permission";
import {
  ErrorMessage,
  SuccessMessage,
  MainWrapper,
  LoadingSpinnerCenter,
  CustomCursor,
  Navbar,
  LinkButton,
  Button,
} from "socis-components";
import { useRouter } from "next/navigation";
import { type Initiative } from "@/types/initiative";
import { isValidInitiativeData } from "@/lib/utils/initiatives";
import config from "@/lib/config/initiative.config";
import { trpc } from "@/lib/trpc/client";

/**
 * The status of the form.
 */
enum FormStatus {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
  EMPTY_FIELDS,
}

/**
 * Wraps the main components in a session provider for next auth.
 *
 * @returns JSX.Element
 */
export default function InitiativeCreationPage(): JSX.Element {
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
 * The main components for the initiatives page. These are to be wrapped in a session provider
 * for next auth.
 *
 * @returns JSX.Element
 */
function Components(): JSX.Element {
  const { data: session, status: sessionStatus } = useSession();
  const { mutateAsync: createInitiative } = trpc.createInitiative.useMutation();
  const router = useRouter();

  const [creationStatus, setCreationStatus] = useState(FormStatus.IDLE);
  const [initiative, setInitiative] = useState<Initiative>(
    config.initiative.default as Initiative,
  );

  /**
   * If the initiative is being created, the user is not authenticated, or the
   * default initiative hasn't been generated (undefined), then return a loading
   * screen.
   */
  if (sessionStatus === "loading" || creationStatus === FormStatus.LOADING) {
    return <LoadingSpinnerCenter />;
  }

  /**
   * Check if the user is authenticated.
   *
   * If the user is not authenticated, then return an invalid session component.
   */
  if (sessionStatus === "unauthenticated" || !session) {
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
   * Check if the user has the permissions to create a initiative.
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
    setCreationStatus(FormStatus.LOADING);

    /**
     * If the provideed data for the initiative being created is invalid, then
     * return an error message. This is so that empty initiatives are not created.
     */
    if (!isValidInitiativeData(initiative)) {
      setCreationStatus(FormStatus.EMPTY_FIELDS);

      return;
    }

    /**
     * Create the initiative using the API.
     */
    const res = await createInitiative({
      accessToken: session.user.secret,
      initiative,
    });

    /**
     * If the initiative was successfully created, then set the status to success.
     */
    if (res.success) {
      setCreationStatus(FormStatus.SUCCESS);

      /**
       * Redirect the user to the next-steps page.
       */
      router.push("/next-steps");
    } else {
      /**
       * If the initiative was not successfully created, then set the status to error.
       */
      setCreationStatus(FormStatus.ERROR);
    }
  }

  /**
   * Return the main components for the initiatives page.
   */
  return (
    <MainWrapper className="p-10 pt-20 lg:p-20 lg:pt-44">
      <form
        className="flex w-full flex-col"
        onSubmit={async (e) => onSubmit(e, initiative, session)}
      >
        {/** HEADER */}
        <h1 className="mb-7 text-5xl font-thin uppercase text-white md:text-7xl">
          Create Initiative
        </h1>

        {/**
         * INITIATIVE NAME
         *
         * The user can add a name to the initiative.
         * This will be displayed on the initiative page.
         */}
        <label className="mb-2 text-white">Initiative Name</label>
        <input
          className="rounded-lg border border-primary bg-secondary px-4 py-3 text-base font-thin tracking-wider text-white duration-300 ease-in-out focus:outline-none"
          maxLength={config.initiative.max.name}
          minLength={config.initiative.min.name}
          placeholder="Name"
          type="text"
          onChange={(e) =>
            setInitiative({ ...initiative, name: e.target.value })
          }
        />

        {/**
         * INITIATIVE DESCRIPTION
         *
         * The user can add a description to the initiative.
         * This will be displayed on the initiative page.
         */}
        <label className="mb-2 mt-5 text-white">Initiative Description</label>
        <textarea
          className="rounded-lg border border-primary bg-secondary px-4 py-3 text-base font-thin tracking-wider text-white duration-300 ease-in-out focus:outline-none"
          maxLength={config.initiative.max.description}
          minLength={config.initiative.min.description}
          placeholder="Description"
          onChange={(e) =>
            setInitiative({ ...initiative, description: e.target.value })
          }
        />

        {/**
         * TODO: Add initiative image (banner) upload
         */}

        {/**
         * CREATE INITIATIVE
         *
         * Once the user is finished creating the initiative, they can submit it.
         * This will send an http request to the API and create the initiative.
         * If the user hasn't filled in all the fields, then the initiative will not be created
         * and an error message will be displayed.
         */}
        <Button type="submit">Create Initiative</Button>

        {/**
         * If the user doesn't want to create the initiative, then they can cancel.
         *
         * This will just redirect them back to the initiatives page.
         */}
        <LinkButton href="/">Cancel</LinkButton>
      </form>

      {/**
       * If the initiative was successfully created, then display a success message.
       *
       * This will appear before the user is redirected to the /next-steps page.
       */}
      {creationStatus === FormStatus.SUCCESS && (
        <SuccessMessage>
          <p>Initiative created successfully!</p>
        </SuccessMessage>
      )}

      {/**
       * If the initiative was not successfully created, then display an error message.
       *
       * The user will have the chance to input the data again.
       */}
      {creationStatus === FormStatus.ERROR && (
        <ErrorMessage>
          <p>There was an error creating your initiative.</p>
        </ErrorMessage>
      )}

      {/**
       * If the user hasn't filled in all the fields, then display an error message.
       *
       * The user will have the chance to input the data again.
       */}
      {creationStatus === FormStatus.EMPTY_FIELDS && (
        <ErrorMessage>
          <p>Make sure all fields are filled in.</p>
        </ErrorMessage>
      )}
    </MainWrapper>
  );
}
