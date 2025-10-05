import NextAuth, { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first login, enrich token with profile basics
      if (account && profile) {
        token.name = profile.name ?? token.name;
        token.picture = (profile as any).picture ?? token.picture;
        token.email = (profile as any).email ?? token.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose basic fields, user_id will be added by sync call below
      session.user = session.user || {};
      session.user.name = token.name as string;
      session.user.image = token.picture as string;
      session.user.email = token.email as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
