"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, User, Users, Home, Settings } from "lucide-react";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { useSession } from "next-auth/react";
import { useDebounce } from "@/hooks/use-debounce";
import { UserAvatar } from "@/components/useravatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Interface for user search results
interface UserSearchResult {
  id: string;
  username: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

export function CommandMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Search for users when input changes
  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedSearch.trim().length === 0) {
        setUsers([]);
        return;
      }

      setLoading(true);
      
      try {
        const supabase = getSupabase(session);
        const { data, error } = await supabase
          .from("users")
          .select("id, username, avatar_url, wallet_address")
          .or(`username.ilike.%${debouncedSearch}%, wallet_address.ilike.%${debouncedSearch}%`)
          .limit(5);

        if (error) {
          console.error("Error searching users:", error);
          return;
        }

        console.log(`Found ${data?.length || 0} results:`, data);
        setUsers(data || []);
      } catch (error) {
        console.error("Error during user search:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      searchUsers();
    }
  }, [debouncedSearch, session]);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigateToProfile = (username: string | null, wallet: string | null) => {
    if (username) {
      router.push(`/${username}`);
    } else if (wallet) {
      router.push(`/${wallet}`);
    }
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-3xl py-2 text-sm hover:bg-white/20 text-white gap-2 bg-white/5 p-2 px-2.5 shadow-none transition-all ease-in-out duration-300"
      >
        <Search className="h-4 w-4 text-white/75 hover:text-white" strokeWidth={2.50} />
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-700 bg-black/30 px-1.5 font-mono text-[10px] font-medium text-gray-400">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-white">Command Menu</DialogTitle>
          </DialogHeader>
          
          {/* Search Input */}
          <div className="px-4 pt-2 pb-4">
            <div className="relative">
              <Search className="absolute text-zinc-400 h-4 w-4 left-3 top-1/2 transform -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users, pages, or type a command..."
                className="w-full bg-zinc-900 text-white rounded-full pl-10 pr-4 py-2 outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {/* User search results */}
            {search.trim() && (
              <div className="pb-2">
                <div className="px-4 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Users ({users.length})
                </div>
                
                {loading ? (
                  <div className="p-4 text-zinc-400 flex items-center">
                    <span className="mr-2 animate-spin">
                      <Search className="h-4 w-4" />
                    </span>
                    Searching...
                  </div>
                ) : (
                  <>
                    {users.length === 0 ? (
                      <div className="p-4 text-zinc-500">
                        No users found matching '{search}'
                      </div>
                    ) : (
                      <div>
                        {users.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => navigateToProfile(user.username, user.wallet_address)}
                            className="p-2 px-4 flex items-center gap-3 hover:bg-zinc-800 cursor-pointer"
                          >
                            <UserAvatar
                              avatarUrl={user.avatar_url || ""}
                              username={user.username || ""}
                              size="default"
                            />
                            <div>
                              <div className="text-white font-medium">
                                {user.username || "Unnamed User"}
                              </div>
                              {user.wallet_address && (
                                <div className="text-xs text-zinc-400">
                                  {user.wallet_address.substring(0, 4)}...{user.wallet_address.substring(user.wallet_address.length - 4)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Navigation section */}
            <div className="py-2 border-t border-zinc-800">
              <div className="px-4 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Navigation
              </div>
              <div>
                <div
                  onClick={() => {
                    router.push("/");
                    setOpen(false);
                  }}
                  className="p-2 px-4 flex items-center gap-3 hover:bg-zinc-800 cursor-pointer"
                >
                  <Home className="h-4 w-4 text-zinc-400" />
                  <span className="text-white">Home</span>
                </div>
                <div
                  onClick={() => {
                    router.push("/people");
                    setOpen(false);
                  }}
                  className="p-2 px-4 flex items-center gap-3 hover:bg-zinc-800 cursor-pointer"
                >
                  <Users className="h-4 w-4 text-zinc-400" />
                  <span className="text-white">Discover People</span>
                </div>
                
                {session?.user && (
                  <div
                    onClick={() => {
                      router.push(`/${session.user.walletAddress}`);
                      setOpen(false);
                    }}
                    className="p-2 px-4 flex items-center gap-3 hover:bg-zinc-800 cursor-pointer"
                  >
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className="text-white">My Profile</span>
                  </div>
                )}
                
                {session?.user && (
                  <div
                    onClick={() => {
                      router.push("/settings");
                      setOpen(false);
                    }}
                    className="p-2 px-4 flex items-center gap-3 hover:bg-zinc-800 cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-zinc-400" />
                    <span className="text-white">Settings</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pages section */}
            <div className="py-2 border-t border-zinc-800">
              <div className="px-4 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Pages
              </div>
              <div>
                <div
                  onClick={() => {
                    router.push("/careers");
                    setOpen(false);
                  }}
                  className="p-2 px-4 flex items-center gap-3 hover:bg-zinc-800 cursor-pointer"
                >
                  <Briefcase className="h-4 w-4 text-zinc-400" />
                  <span className="text-white">Careers</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}