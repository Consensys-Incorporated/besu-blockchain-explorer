import { Head, Html, Main, NextScript } from "next/document";

const basePath = process.env.NEXT_PUBLIC_QE_BASEPATH ?? "";

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="icon" href={`${basePath}/images/favicon.svg`} type="image/svg+xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
