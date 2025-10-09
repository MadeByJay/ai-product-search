import { NEST_API_BASE } from "@/app/lib/constants";
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
      // Enrich basic fields when sign-in occurs
      if (account && profile) {
        token.name = (profile as any).name ?? token.name;
        token.picture = (profile as any).picture ?? token.picture;
        token.email = (profile as any).email ?? token.email;
      }

      // If we have an email but no userId, sync with the API to get a stable user id
      const email = token.email as string | undefined;
      if (email && !(token as any).userId) {
        if (!NEST_API_BASE) {
          console.warn(
            "[auth] NEXT_PUBLIC_API_BASE is not set; cannot sync userId",
          );
          return token;
        }

        try {
          const response = await fetch(`${NEST_API_BASE}/users/sync`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              email,
              name: token.name,
              avatar_url: token.picture,
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as { id: string };
            (token as any).userId = data.id;
          } else {
            console.warn("[auth] users/sync responded", response.status);
          }
        } catch (error) {
          console.warn("[auth] users/sync failed", (error as Error)?.message);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Surface userId to the session
      (session.user as any) = {
        ...session.user,
        id: (token as any).userId ?? null,
      };
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
