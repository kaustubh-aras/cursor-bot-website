import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || []

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (allowedEmails.includes(user.email!)) {
        return true
      }
      return false
    },
    async session({ session }) {
      return session
    },
  },
})

export { handler as GET, handler as POST }
