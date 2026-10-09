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

export const authOptions: NextAuthOptions = {
  providers: providers.filter((p): p is Provider => !!p),
  theme: { colorScheme: "auto" },
};
