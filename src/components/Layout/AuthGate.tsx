import type { ReactNode } from "react";
import { signIn, useSession } from "next-auth/react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AuthGate({ disableAuth, children }: { disableAuth: boolean; children: ReactNode }) {
  const { status } = useSession();
  if (disableAuth || status === "authenticated") return <>{children}</>;
  if (status === "loading") {
    return (
      <div className="grid flex-1 place-items-center py-24">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted">
        <Lock className="size-6 text-muted-foreground" />
      </span>
      <h1 className="text-2xl font-semibold">Sign in required</h1>
      <p className="text-muted-foreground">You must be signed in to view this page.</p>
      <Button size="lg" onClick={() => signIn()}>
        Sign in
      </Button>
    </div>
  );
}
