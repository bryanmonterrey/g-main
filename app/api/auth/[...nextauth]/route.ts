// The correct way for Next.js 15 with App Router
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Create handler directly in the route file
const handler = NextAuth(authOptions);
export const GET = handler.GET;
export const POST = handler.POST;