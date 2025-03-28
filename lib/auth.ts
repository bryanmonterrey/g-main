import { DefaultSession, NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth/next"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import jwt from "jsonwebtoken"
import { SigninMessage } from "@/utils/SigninMessage";
import { getSupabase } from "@/utils/supabase/supabase"
import { signIn, signOut } from "next-auth/react"
import type { JWT } from "next-auth/jwt"

// Define the config object separately
export const authOptions: NextAuthOptions = {
  debug: !!process.env.AUTH_DEBUG,
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "web3-auth",
      credentials: {
        message: {
          label: "Message",
          type: "text",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
        csrfToken: {
          label: "CSRF Token",
          type: "text",
        },
      },
      async authorize(credentials): Promise<User | null> {    
        try {
          const signinMessage = new SigninMessage(
            JSON.parse((credentials?.message as string) || "{}")
          );

          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!);

          if (signinMessage.domain !== nextAuthUrl.host) {
            throw new Error("Domain mismatch");
          }

          if (signinMessage.nonce !== credentials.csrfToken) {
            throw new Error("CSRF token mismatch");
          }

          const validationResult = await signinMessage.validate(
            (credentials?.signature as string) || ""
          );

          if (!validationResult)
            throw new Error("Could not validate the signed message");

          // First log what we're checking
console.log('Checking for wallet address:', signinMessage.publicKey);

// Check if user exists in Supabase
const supabase = await getSupabase();
let { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", signinMessage.publicKey)
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors

console.log('User check result:', { exists: !!user, error });

// If the user doesn't exist, create them
if (!user) {
  try {
      const newUserId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      // Log initial attempt
      console.log('New wallet detected:', signinMessage.publicKey);
      
      // Double check both schemas to make sure user really doesn't exist
      const { data: doubleCheck, error: checkError } = await supabase
          .from("users")
          .select("*")
          .or(`wallet_address.eq.${signinMessage.publicKey},id.eq.${newUserId}`)
          .maybeSingle();

      if (doubleCheck) {
          console.log('Found existing user in double check:', doubleCheck);
          user = doubleCheck;
          return {
              id: user.id,
              walletAddress: user.wallet_address || "",
              role: user.role || "user",
          };
      }

      // Log creation attempt
      console.log('Creating new user:', {
          id: newUserId,
          wallet: signinMessage.publicKey
      });

      // Create user in next_auth schema
      const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ 
              id: newUserId,
              wallet_address: signinMessage.publicKey, 
              role: "user",
              created_at: now,
              updated_at: now,
              last_signed_in: now
          })
          .select()
          .single();

      if (insertError) {
          console.error("Error creating user:", {
              error: insertError,
              attempted_id: newUserId,
              wallet: signinMessage.publicKey
          });
          return null;
      }

      console.log('Successfully created user:', newUser);
      user = newUser;
  } catch (error) {
      console.error("Error in user creation flow:", error);
      return null;
  }
}
    console.log('User authenticated:', user);
    console.log('Authorization successful for wallet:', signinMessage.publicKey);
    
    return {
        id: user.id,
        walletAddress: user.wallet_address || "",
        role: user.role || "user",
    };
  } catch (error) {
      console.error("Error during authorization:", error);
      return null;
  }
  },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  }),
  logger: {
    error: (code, ...message) => {
      console.error(code, message)
      console.log('Debug ENV:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSecret: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      })
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      const supabase = await getSupabase();

      if (!user) {
        console.error("User not found");
        return false;
      }

      // Fetch user role & wallet from Supabase for verification
      const { data: dbUser, error } = await supabase
        .from("users")
        .select("wallet_address, role")
        .eq("id", user.id as string)
        .single();

      if (error || !dbUser) {
        console.error("Failed to fetch user details");
        return false;
      }

      // Verify that the wallet belongs to the user
      if (dbUser.wallet_address !== user.walletAddress) {
        console.error("Wallet address mismatch");
        return false;
      }

      // Implement role-based access control
      const allowedRoles = ["admin", "user"]; // Define allowed roles
      if (!allowedRoles.includes(dbUser.role || "")) {
        console.error("User role not authorized:", dbUser.role);
        return false;
      }

      // Update last_signed_in timestamp
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          last_signed_in: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id as string);

      if (updateError) {
        console.error("Failed to update last_signed_in:", updateError);
      }
      console.log('Sign-in successful for wallet:', dbUser.wallet_address);
      return true; // Allow sign-in
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.walletAddress = user.walletAddress as string;
        token.role = user.role as string;
      }
      if (account) {
        const signingSecret = process.env.SUPABASE_JWT_SECRET;
        if (signingSecret) {
          const payload = {
            aud: "authenticated", 
            exp: Math.floor(new Date(Date.now() + 24 * 60 * 60 * 1000).getTime() / 1000),
            sub: user?.id,
            email: user?.email,
            role: "authenticated",
          };
          token.supabaseAccessToken = jwt.sign(payload, signingSecret);
        }
      }
      console.log('Token:', token);
      return token;
    },
    async session({ session, token }) {
      const supabase = await getSupabase();

          // Get the user's data from Supabase to include avatar_url and username
      const { data: userData, error } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', token.id)
      .single();

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = userData?.username || token.sub;
        session.user.image = userData?.avatar_url || ``;
        session.user.walletAddress = token.walletAddress;
        session.supabaseAccessToken = token.supabaseAccessToken;
        
      }
      
      // Check if a session exists
      const { data: existingSession, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('userId', token.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error checking for existing session:", fetchError);
      }

      if (existingSession) {
        // Delete existing session
        const { error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .eq('userId', token.id);

        if (deleteError) {
          console.error("Error deleting existing session:", deleteError);
        }
      } else {
        // Only create new session if there wasn't an existing one
        const sessionData = {
          id: crypto.randomUUID(),
          userId: token.id,
          expires: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
          sessionToken: crypto.randomUUID()
        };

        const { error: sessionError } = await supabase
          .from('sessions')
          .insert(sessionData);

        if (sessionError) {
          console.error("Error creating new session:", sessionError);
          return false;
        }
        console.log('New session created successfully');
      }

      return session;
    },
  },
};


// Export types for TypeScript
declare module "next-auth" {
  interface User {
    walletAddress?: string;
    role?: string;
  }
  
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      image?: string | null;
      walletAddress?: string;
    } & DefaultSession["user"];
    supabaseAccessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    walletAddress: string;
    role: string;
  }
}