/** @type {import('next').NextConfig} */
const basePath = process.env.BE_BASEPATH || "";

module.exports = {
  basePath,
  reactStrictMode: true,
  // Self-contained server bundle for a slim Docker image.
  output: "standalone",
  // Exposed to the browser so client-side fetches can prefix API routes.
  env: { NEXT_PUBLIC_BE_BASEPATH: basePath },
  async redirects() {
    if (basePath === "") {
      return [{ source: "/", destination: "/nodes", permanent: false }];
    }
    return [
      { source: "/", destination: `${basePath}/nodes`, basePath: false, permanent: false },
      { source: "/api/:path*", destination: `${basePath}/api/:path*`, basePath: false, permanent: false },
      { source: basePath, destination: `${basePath}/nodes`, basePath: false, permanent: false },
    ];
  },
};
