import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") ?? [];

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Check if user's email is in the allowed list
      if (allowedEmails.includes(user.email)) {
        return true; // Allow sign-in
      } else {
        return false; // Deny sign-in
      }
    },
  },
});
