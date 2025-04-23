// app/(dashboard)/dashboard/[walletAddress]/settings/_components/ApiKeysSettings.tsx
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getSupabase } from '@/utils/supabase/getDataWhenAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Key, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UserApiKeys {
  id: string;
  user_id: string;
  openai_api_key?: string;
  claude_api_key?: string;
  twitter_api_key?: string;
  twitter_api_secret?: string;
  twitter_access_token?: string;
  twitter_access_secret?: string;
  created_at: string;
  updated_at: string;
}

const API_TABS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'claude', name: 'Claude' },
  { id: 'twitter', name: 'Twitter' },
];

export function ApiKeysSettings() {
  const { data: session } = useSession();
  const supabase = getSupabase(session);
  
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<UserApiKeys | null>(null);
  const [activeTab, setActiveTab] = useState('openai');
  const [showKeys, setShowKeys] = useState({
    openai: false,
    claude: false,
    twitter: false
  });
  const [savingKeys, setSavingKeys] = useState({
    openai: false,
    claude: false,
    twitter: false
  });

  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        setApiKeys(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load API keys');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, [session]);

  const handleSaveKey = async (keyType: 'openai' | 'claude' | 'twitter', values: any) => {
    if (!session?.user?.id) return;

    setSavingKeys(prev => ({ ...prev, [keyType]: true }));

    try {
      const updates: any = {};
      
      if (keyType === 'openai') {
        updates.openai_api_key = values.apiKey;
      } else if (keyType === 'claude') {
        updates.claude_api_key = values.apiKey;
      } else if (keyType === 'twitter') {
        updates.twitter_api_key = values.apiKey;
        updates.twitter_api_secret = values.apiSecret;
        updates.twitter_access_token = values.accessToken;
        updates.twitter_access_secret = values.accessSecret;
      }

      if (apiKeys) {
        const { error } = await supabase
          .from('user_api_keys')
          .update(updates)
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_api_keys')
          .insert({
            user_id: session.user.id,
            ...updates
          });

        if (error) throw error;
      }

      const { data, error: fetchError } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) throw fetchError;
      setApiKeys(data);
      toast.success(`${keyType.charAt(0).toUpperCase() + keyType.slice(1)} API keys saved successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save API keys');
    } finally {
      setSavingKeys(prev => ({ ...prev, [keyType]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'openai':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveKey('openai', { apiKey: formData.get('openai_api_key') });
          }} className="space-y-4">
            <div className="relative">
              <Input
                name="openai_api_key"
                type={showKeys.openai ? "text" : "password"}
                placeholder="sk-..."
                defaultValue={apiKeys?.openai_api_key ? '••••••••••••••••' : ''}
                className="w-full rounded-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))}
              >
                {showKeys.openai ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={savingKeys.openai}
              className="flex items-center rounded-full ml-auto"
            >
              {savingKeys.openai ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </form>
        );
      case 'claude':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveKey('claude', { apiKey: formData.get('claude_api_key') });
          }} className="space-y-4">
            <div className="relative">
              <Input
                name="claude_api_key"
                type={showKeys.claude ? "text" : "password"}
                placeholder="sk-ant-..."
                defaultValue={apiKeys?.claude_api_key ? '••••••••••••••••' : ''}
                className="w-full rounded-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKeys(prev => ({ ...prev, claude: !prev.claude }))}
              >
                {showKeys.claude ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={savingKeys.claude}
              className="flex items-center rounded-full ml-auto"
            >
              {savingKeys.claude ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </form>
        );
      case 'twitter':
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveKey('twitter', {
              apiKey: formData.get('twitter_api_key'),
              apiSecret: formData.get('twitter_api_secret'),
              accessToken: formData.get('twitter_access_token'),
              accessSecret: formData.get('twitter_access_secret')
            });
          }} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <Input
                  name="twitter_api_key"
                  type={showKeys.twitter ? "text" : "password"}
                  placeholder="Twitter API Key"
                  defaultValue={apiKeys?.twitter_api_key ? '••••••••••••••••' : ''}
                  className="w-full rounded-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Secret</label>
                <Input
                  name="twitter_api_secret"
                  type={showKeys.twitter ? "text" : "password"}
                  placeholder="Twitter API Secret"
                  defaultValue={apiKeys?.twitter_api_secret ? '••••••••••••••••' : ''}
                  className="w-full rounded-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Access Token</label>
                <Input
                  name="twitter_access_token"
                  type={showKeys.twitter ? "text" : "password"}
                  placeholder="Twitter Access Token"
                  defaultValue={apiKeys?.twitter_access_token ? '••••••••••••••••' : ''}
                  className="w-full rounded-full"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Access Secret</label>
                <Input
                  name="twitter_access_secret"
                  type={showKeys.twitter ? "text" : "password"}
                  placeholder="Twitter Access Secret"
                  defaultValue={apiKeys?.twitter_access_secret ? '••••••••••••••••' : ''}
                  className="w-full rounded-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 bottom-0 h-10 px-3"
                  onClick={() => setShowKeys(prev => ({ ...prev, twitter: !prev.twitter }))}
                >
                  {showKeys.twitter ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={savingKeys.twitter}
              className="flex items-center rounded-full ml-auto"
            >
              {savingKeys.twitter ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">API Keys</h2>
        <p className="text-sm text-gray-500">Configure your API keys for AI services and Twitter integration</p>
        
        {/* API Provider Tabs */}
        <div className="flex gap-2 flex-wrap relative mb-8">
          {API_TABS.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-1.5 px-3 text-sm font-semibold rounded-full transition-all relative z-10",
                activeTab === tab.id
                  ? "text-white/80"
                  : "text-azul/70 hover:text-white hover:bg-zinc-900/65"
              )}
            >
              {tab.name}
              
              {/* Animated pill background */}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="apiTabHighlight"
                  className="absolute inset-0 bg-azul/15 text-white rounded-full -z-10"
                  initial={false}
                  transition={{ 
                    type: "spring", 
                    stiffness: 250, 
                    damping: 30 
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>

      {/* Security Information */}
      <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <h3 className="text-sm font-semibold mb-2">Security Information</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-500">
          <li>API keys are encrypted before storage</li>
          <li>Never share your API keys with anyone</li>
          <li>You can regenerate API keys from their respective platforms if compromised</li>
          <li>All API requests are made securely from the server</li>
        </ul>
      </div>
    </div>
  );
}