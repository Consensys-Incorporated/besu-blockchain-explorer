import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import AtlassianProvider from "next-auth/providers/atlassian";
import Auth0Provider from "next-auth/providers/auth0";
import AzureADProvider from "next-auth/providers/azure-ad";
import CognitoProvider from "next-auth/providers/cognito";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GithubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import GoogleProvider from "next-auth/providers/google";
import OktaProvider from "next-auth/providers/okta";
import SlackProvider from "next-auth/providers/slack";
import TwitterProvider from "next-auth/providers/twitter";

export function isAuthDisabled() {
  return process.env.DISABLE_AUTH === "true";
}

const env = process.env;

// Each provider is only enabled when all of its env vars are set.
const providers: (Provider | false)[] = [
  !!(env.GITHUB_ID && env.GITHUB_SECRET) &&
    GithubProvider({ clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET }),
  !!(env.GITLAB_CLIENT_ID && env.GITLAB_CLIENT_SECRET) &&
    GitlabProvider({ clientId: env.GITLAB_CLIENT_ID, clientSecret: env.GITLAB_CLIENT_SECRET }),
  !!(env.GOOGLE_ID && env.GOOGLE_SECRET) &&
    GoogleProvider({ clientId: env.GOOGLE_ID, clientSecret: env.GOOGLE_SECRET }),
  !!(env.FACEBOOK_ID && env.FACEBOOK_SECRET) &&
    FacebookProvider({ clientId: env.FACEBOOK_ID, clientSecret: env.FACEBOOK_SECRET }),
  !!(env.TWITTER_ID && env.TWITTER_SECRET) &&
    TwitterProvider({ clientId: env.TWITTER_ID, clientSecret: env.TWITTER_SECRET }),
  !!(env.AUTH0_ID && env.AUTH0_SECRET && env.AUTH0_ISSUER) &&
    Auth0Provider({ clientId: env.AUTH0_ID, clientSecret: env.AUTH0_SECRET, issuer: env.AUTH0_ISSUER }),
  !!(env.AZURE_AD_CLIENT_ID && env.AZURE_AD_CLIENT_SECRET && env.AZURE_AD_TENANT_ID) &&
    AzureADProvider({
      clientId: env.AZURE_AD_CLIENT_ID,
      clientSecret: env.AZURE_AD_CLIENT_SECRET,
      tenantId: env.AZURE_AD_TENANT_ID,
    }),
  !!(env.ATLASSIAN_CLIENT_ID && env.ATLASSIAN_CLIENT_SECRET) &&
    AtlassianProvider({
      clientId: env.ATLASSIAN_CLIENT_ID,
      clientSecret: env.ATLASSIAN_CLIENT_SECRET,
      authorization: { params: { scope: "read:me offline_access" } },
    }),
  !!(env.COGNITO_CLIENT_ID && env.COGNITO_CLIENT_SECRET && env.COGNITO_ISSUER) &&
    CognitoProvider({
      clientId: env.COGNITO_CLIENT_ID,
      clientSecret: env.COGNITO_CLIENT_SECRET,
      issuer: env.COGNITO_ISSUER,
    }),
  !!(env.OKTA_CLIENT_ID && env.OKTA_CLIENT_SECRET && env.OKTA_ISSUER) &&
    OktaProvider({
      clientId: env.OKTA_CLIENT_ID,
      clientSecret: env.OKTA_CLIENT_SECRET,
      issuer: env.OKTA_ISSUER,
    }),
  !!(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET) &&
    SlackProvider({ clientId: env.SLACK_CLIENT_ID, clientSecret: env.SLACK_CLIENT_SECRET }),
  !!(env.local_username && env.local_password) &&
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === env.local_username &&
          credentials?.password === env.local_password
        ) {
          return { id: "local", name: env.local_username };
        }
        return null;
      },
    }),
];

// Comma-separated, case-insensitive.
function envList(name: string): string[] {
  return (env[name] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

const allowedEmails = envList("BE_ALLOWED_EMAILS");
const allowedDomains = envList("BE_ALLOWED_DOMAINS");

// An OAuth provider proves who someone is, not that they may use the explorer:
// enabling Google would otherwise let in every Google account. So OAuth
// sign-ins must match an allowed email or domain. Domains match exactly, so
// example.com doesn't admit sub.example.com or evil-example.com. With neither
// list set, nobody gets in through OAuth.
export function isEmailAllowed(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return false;
  return allowedEmails.includes(normalized) || allowedDomains.includes(normalized.slice(at + 1));
}

const enabledProviders = providers.filter((p): p is Provider => !!p);

if (
  !isAuthDisabled() &&
  allowedEmails.length === 0 &&
  allowedDomains.length === 0 &&
  enabledProviders.some((p) => p.type === "oauth")
) {
  console.warn(
    "OAuth sign-in is configured but BE_ALLOWED_EMAILS and BE_ALLOWED_DOMAINS are empty, " +
      "so all OAuth sign-ins will be denied"
  );
}

export const authOptions: NextAuthOptions = {
  providers: enabledProviders,
  theme: { colorScheme: "auto" },
  // NextAuth's default is 30 days. Each session check renews the cookie, so this
  // signs people out after 8 hours without using the explorer.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async signIn({ account, profile, user }) {
      // The local username/password is set by whoever deploys the explorer.
      if (account?.provider === "credentials") return true;
      const email = profile?.email ?? user.email ?? "";
      // OIDC providers (Google, Auth0, Okta, Cognito) say whether they verified
      // the address; Cognito sends it as a string.
      const verified = (profile as { email_verified?: unknown } | undefined)?.email_verified;
      const allowed =
        email !== "" && verified !== false && verified !== "false" && isEmailAllowed(email);
      if (!allowed) {
        console.warn(`Sign-in denied for ${email || "an account with no email"} via ${account?.provider}`);
      }
      return allowed;
    },
  },
};
