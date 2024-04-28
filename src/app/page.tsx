"use client";

import { useEffect, useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { type Initiative } from "@/types/global/initiative";
import { trpc } from "@/lib/trpc/client";
import { Permission } from "@/types/global/permission";
import InitiativeCard from "@/components/ui/InitiativeCard";
import { Button, Spinner } from "@nextui-org/react";
import CustomCursor from "@/components/ui/global/CustomCursor";
import MainWrapper from "@/components/ui/global/MainWrapper";
import Background from "@/components/ui/global/Background";
import Link from "next/link";
import { type Status } from "@/types/global/status";
import Navbar from "@/components/ui/global/Navbar";

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
      <Background text={"INITATIVES"} animated={false} />

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
  const { mutateAsync: getInitiatives } = trpc.getAllInitiatives.useMutation();

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  /**
   * We need to access the initiatives from the database.
   */
  useEffect(() => {
    /**
     * If the fetch status is not idle, then we don't need to
     * fetch the initiatives again.
     */
    if (status !== "idle") {
      return;
    }

    setStatus("loading");

    /**
     * Fetch the initiatives from the database.
     */
    getInitiatives()
      .then((res) => {
        setInitiatives(res.initiatives);
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [session]);

  /**
   * If the fetch is still in progress, display a loading spinner.
   */
  if (sessionStatus === "loading" || status === "loading") {
    return (
      <MainWrapper className="flex min-h-screen w-screen flex-col items-center justify-center">
        <Spinner size="lg" color="primary" />
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
    <MainWrapper className="fade-in relative z-40 flex min-h-screen w-screen flex-col items-start justify-start gap-12 px-12 pb-20 pt-36 lg:px-20">
      <div className="flex flex-col items-start justify-start gap-3">
        <h1 className="text-left text-4xl font-extrabold uppercase text-white md:text-7xl lg:text-8xl">
          SOCIS Initiatives
        </h1>

        <p className="max-w-2xl text-left text-sm font-thin text-white">
          Explore all of the initiatives that SOCIS supports! If you are
          interested in helping out with any of these initiatives, please reach
          out to a club executive, we&apos;d love to have you on board!
        </p>

        {CAN_CREATE_INITIATIVE && (
          <Button as={Link} color="primary" href="/create" className="w-fit">
            Create Initiative
          </Button>
        )}
      </div>

      {status === "error" && (
        <p className="text-red-500">Failed to fetch initiatives.</p>
      )}

      {/**
       * Render all of the initiative cards
       */}
      <div className="flex w-full flex-wrap items-start justify-start gap-10">
        {initiatives.map((initiative) => (
          <InitiativeCard
            user={session?.user}
            key={initiative.id}
            initiative={initiative}
          />
        ))}
      </div>
    </MainWrapper>
  );
}
