// This is the correct way to export route handlers in Next.js 15
import { auth } from "@/lib/auth";

export const GET = auth.GET;
export const POST = auth.POST;