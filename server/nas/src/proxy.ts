import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "local-nas-super-secret",
  callbacks: {
    authorized: ({ req, token }) => {
      // Si existe un token, el usuario está logueado
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
