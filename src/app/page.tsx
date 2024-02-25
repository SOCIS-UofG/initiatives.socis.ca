"use client";

import { useEffect, useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { type Initiative } from "@/types/initiative";
import {
  ErrorMessage,
  MainWrapper,
  LoadingSpinnerCenter,
  CustomCursor,
  Navbar,
  LinkButton,
} from "socis-components";
import { trpc } from "@/lib/trpc/client";
import { Permission } from "@/types/permission";
import InitiativeCard from "@/components/InitiativeCard";

/**
 * Wraps the main components in a session provider for next auth.
 *
 * @returns JSX.Element
 */
export default function InitiativesPage() {
  return (
    <>
      <Navbar />
      <CustomCursor />
      {/**<Background text={"INITATIVES"} animated={false} className="-z-10" /> */}

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
  const { mutateAsync: getInitiatives, status: fetchStatus } =
    trpc.getAllInitiatives.useMutation();

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);

  /**
   * We need to access the initiatives from the database.
   */
  useEffect(() => {
    /**
     * If the fetch status is not idle, then we don't need to
     * fetch the initiatives again.
     */
    if (fetchStatus !== "idle") {
      return;
    }
    /**
     * Fetch the initiatives from the database.
     */
    getInitiatives().then((res) => setInitiatives(res.initiatives));
  }, [session]);

  /**
   * If the fetch is still in progress, display a loading spinner.
   */
  if (sessionStatus === "loading" || fetchStatus === "loading") {
    return <LoadingSpinnerCenter />;
  }

  /**
   * If the fetch failed, display an error message.
   *
   * TODO: Add a refresh button.
   */
  if (fetchStatus === "error") {
    return (
      <MainWrapper>
        <ErrorMessage>
          An error occurred while fetching the initiatives. Please try again
          later.
        </ErrorMessage>
      </MainWrapper>
    );
  }

  /**
   * Store if the user is authenticated and can create initiatives.
   */
  const CAN_CREATE_INITIATIVE = session?.user.permissions.includes(
    Permission.ADMIN,
  );

  /**
   * Return the main components
   */
  return (
    <MainWrapper className="fade-in items-start justify-start gap-12 px-12 pb-20 pt-36 lg:px-20">
      <div className="flex flex-col items-start justify-start gap-3">
        <h1 className="text-left text-4xl font-extrabold uppercase text-white md:text-7xl lg:text-8xl">
          Club Initiatives
        </h1>
        <p className="max-w-2xl text-left text-sm font-thin text-white">
          Explore all of the initiatives that SOCIS supports at The University
          of Guelph. If you are interested in helping out with any of these
          initiatives, please reach out to a club executive.
        </p>

        {CAN_CREATE_INITIATIVE && (
          <div className="flex w-full flex-col items-start justify-start gap-4 md:flex-row">
            <LinkButton href="/create" className="w-fit">
              Create Initiative
            </LinkButton>
          </div>
        )}
      </div>

      {/**
       * Render all of the initiative cards
       */}
      <div className="flex flex-wrap justify-center gap-10">
        {initiatives.map((initiative) => (
          <InitiativeCard key={initiative.id} initiative={initiative} />
        ))}
      </div>
    </MainWrapper>
  );
}
