import type { AppProps } from "next/app";
import Head from "next/head";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthGate } from "@/components/Layout/AuthGate";
import { Footer } from "@/components/Layout/Footer";
import { NavBar } from "@/components/Layout/NavBar";
import { NodeProvider } from "@/lib/nodeContext";
import "@/styles/globals.css";

const basePath = process.env.NEXT_PUBLIC_QE_BASEPATH ?? "";

type Props = AppProps<{ session?: Session | null; disableAuth?: boolean }>;

export default function App({ Component, pageProps }: Props) {
  const { session, disableAuth = false } = pageProps;
  return (
    <SessionProvider
      session={session}
      basePath={`${basePath}/api/auth`}
      refetchInterval={disableAuth ? 0 : 5 * 60}
      refetchOnWindowFocus={!disableAuth}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Head>
          <title>Besu Explorer</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <NodeProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
            <AuthGate disableAuth={disableAuth}>
              <Component {...pageProps} />
            </AuthGate>
          </main>
          <Footer />
        </NodeProvider>
        <Toaster richColors closeButton position="bottom-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
