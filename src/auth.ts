import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import clientPromise from "./lib/db/mongodb";

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
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      // For Apple, you typically need to handle the private key generation and pass it as the secret,
      // but next-auth/providers/apple can handle it if APPLE_CLIENT_SECRET is a generated JWT.
      // Or you can configure NextAuth to generate it using APPLE_TEAM_ID, APPLE_PRIVATE_KEY, APPLE_KEY_ID, etc.
      // NextAuth v5 supports passing these directly or via env vars.
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
