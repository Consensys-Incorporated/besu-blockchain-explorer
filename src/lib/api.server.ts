import type { GetServerSidePropsContext, NextApiHandler } from "next";
import { getServerSession } from "next-auth";
import { authOptions, isAuthDisabled } from "@/lib/auth";
import { loadConfig } from "@/lib/config";
import { RpcError } from "@/lib/rpc";

// Wraps a POST API route with the auth check and consistent JSON error handling.
// The handler receives the parsed request body and returns the response payload.
export function apiRoute<T>(
  handler: (body: Record<string, unknown>) => Promise<T>
): NextApiHandler {
  return async (req, res) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (!isAuthDisabled() && !(await getServerSession(req, res, authOptions))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      res.status(200).json(await handler(req.body ?? {}));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(message);
      res.status(e instanceof RpcError ? 502 : 500).json({ error: message });
    }
  };
}

// Shared getServerSideProps for every page: node config plus auth state.
export async function getPageProps(ctx: GetServerSidePropsContext) {
  const config = await loadConfig();
  const disableAuth = isAuthDisabled();
  const session = disableAuth
    ? null
    : await getServerSession(ctx.req, ctx.res, authOptions);
  return {
    props: {
      config,
      disableAuth,
      // Round-trip to drop `undefined` fields, which Next can't serialize.
      session: session ? JSON.parse(JSON.stringify(session)) : null,
    },
  };
}
