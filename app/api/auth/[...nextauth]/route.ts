// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Initialize NextAuth in the route handler file
const handler = NextAuth(authOptions);

// Log handler details for debugging
console.log("Auth handler initialized with:", {
  GET: typeof handler.GET,
  POST: typeof handler.POST
});

// Export the route handlers
export { handler as GET, handler as POST };