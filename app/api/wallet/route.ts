import { NextResponse } from "next/server";
import { createSupabaseClient } from '@/utils/supabase/client-example';

// get the wallet address from the user
export async function GET() {
    try {
        const supabase = createSupabaseClient();
        
        // Get the authenticated user's wallet only
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ 
                wallets: [{
                    name: "Default Agent Wallet",
                    subTxt: "Connect your wallet to see address"
                }] 
            });
        }

        const { data: wallet, error } = await supabase
            .from('users')
            .select('wallet_address')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        return NextResponse.json({ wallets: [{
            name: "Connected Wallet",
            subTxt: wallet?.wallet_address || "Connect wallet to continue"
        }] });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ 
            wallets: [{
                name: "Default Agent Wallet",
                subTxt: "Connect your wallet to see address"
            }] 
        });
    }
}