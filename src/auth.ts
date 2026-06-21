import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import { SignJWT, importPKCS8 } from "jose";
import clientPromise from "./lib/db/mongodb";

async function getAppleClientSecret() {
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;

  if (!privateKey || !teamId || !keyId || !clientId) {
    return process.env.AUTH_APPLE_SECRET || "";
  }

  const key = await importPKCS8(privateKey, "ES256");
  return new SignJWT({})
    .setAudience("https://appleid.apple.com")
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("180d")
    .setSubject(clientId)
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .sign(key);
}

const appleSecret = await getAppleClientSecret();

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: MongoDBAdapter(clientPromise, { databaseName: process.env.DB_NAME }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: appleSecret,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
