import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Call backend to register/login user with Google
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            googleId: account.providerAccountId,
            picture: user.image,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store backend token and user data
          user.backendToken = data.token;
          user.userData = data.user;
          return true;
        }

        return false;
      } catch (error) {
        console.error('Google auth error:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Pass backend token to JWT
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
        token.userData = user.userData;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass backend token to session
      if (token?.backendToken) {
        session.backendToken = token.backendToken;
        session.userData = token.userData;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
