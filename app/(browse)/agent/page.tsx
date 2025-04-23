// app/(browse)/agent/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSupabase } from '@/utils/supabase/getDataWhenAuth';
import { Database } from "@/types/supabase";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Bot, AlertCircle, CheckCircle2, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIAgent {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'inactive' | 'paused';
  mode: 'auto' | 'manual';
  twitter_account_id?: string;
  settings: {
    tone?: string;
    topics?: string[];
    tweet_frequency?: number;
    response_style?: string;
    engagement_enabled?: boolean;
  };
  performance_metrics?: {
    total_tweets: number;
    total_likes: number;
    total_retweets: number;
    avg_engagement_rate: number;
  };
  last_tweet_at?: string;
  created_at: string;
  updated_at: string;
}

const AGENT_TABS = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'generate', name: 'Generate Tweet' },
  { id: 'config', name: 'Configuration' },
];

const Page = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tweetPreview, setTweetPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModel, setSelectedModel] = useState<'openai' | 'claude'>('openai');
  
  const supabase = getSupabase(session);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setAgent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [session]);

  const handleAgentModeChange = async (newMode: 'auto' | 'manual') => {
    if (!agent || !session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({ mode: newMode })
        .eq('id', agent.id);

      if (error) throw error;

      setAgent({ ...agent, mode: newMode });
      setSuccess(`Agent mode switched to ${newMode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent mode');
    }
  };

  const handleGenerateTweet = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          agentId: agent?.id,
          model: selectedModel 
        }),
      });

      if (!response.ok) throw new Error('Failed to generate tweet');

      const data = await response.json();
      setTweetPreview(data.tweet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tweet');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendTweet = async () => {
    if (!tweetPreview.trim() || !agent) return;

    try {
      const response = await fetch('/api/send-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tweet: tweetPreview, 
          agentId: agent.id 
        }),
      });

      if (!response.ok) throw new Error('Failed to send tweet');

      setSuccess('Tweet sent successfully!');
      setTweetPreview("");
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tweet');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Agent Status
              </CardTitle>
              <CardDescription>
                Control your agent's behavior and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Agent Mode</h3>
                    <p className="text-sm text-gray-500">
                      {agent?.mode === 'auto' ? 'Agent tweets automatically' : 'Manual control only'}
                    </p>
                  </div>
                  <Switch
                    checked={agent?.mode === 'auto'}
                    onCheckedChange={(checked) => handleAgentModeChange(checked ? 'auto' : 'manual')}
                  />
                </div>

                <div>
                  <h3 className="font-medium mb-2">Activity</h3>
                  <div className="text-sm text-gray-500">
                    Last tweet: {agent?.last_tweet_at ? new Date(agent.last_tweet_at).toLocaleString() : 'Never'}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Performance</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Tweets</div>
                      <div className="font-semibold">{agent?.performance_metrics?.total_tweets || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg. Engagement</div>
                      <div className="font-semibold">
                        {agent?.performance_metrics?.avg_engagement_rate 
                          ? `${agent.performance_metrics.avg_engagement_rate.toFixed(1)}%` 
                          : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'generate':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="w-5 h-5" />
                Tweet Generation
              </CardTitle>
              <CardDescription>
                Generate tweets using your AI agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    AI Model
                  </label>
                  <select 
                    className="w-full p-2 border rounded-md bg-zinc-900 text-white border-zinc-700"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'claude')}
                  >
                    <option value="openai">OpenAI GPT-4</option>
                    <option value="claude">Claude 3 Sonnet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prompt for tweet
                  </label>
                  <Textarea
                    placeholder="What should your agent tweet about?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>

                <Button 
                  onClick={handleGenerateTweet}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Tweet'
                  )}
                </Button>

                {tweetPreview && (
                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium">Tweet Preview</h3>
                      <span className="text-sm text-gray-500">
                        {tweetPreview.length}/280
                      </span>
                    </div>
                    <p className="mb-4">{tweetPreview}</p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSendTweet}
                        className="flex-1"
                      >
                        Send Tweet
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setTweetPreview("")}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'config':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Fine-tune your agent's personality and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Agent Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md bg-zinc-900 text-white border-zinc-700"
                    value={agent?.name || ''}
                    onChange={(e) => setAgent(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select 
                    className="w-full p-2 border rounded-md bg-zinc-900 text-white border-zinc-700"
                    value={agent?.settings?.tone || 'professional'}
                    onChange={(e) => setAgent(prev => prev ? {
                      ...prev, 
                      settings: {...prev.settings, tone: e.target.value}
                    } : null)}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="humorous">Humorous</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Topics</label>
                  <Textarea
                    placeholder="Enter topics, separated by commas"
                    value={agent?.settings?.topics?.join(', ') || ''}
                    onChange={(e) => setAgent(prev => prev ? {
                      ...prev, 
                      settings: {...prev.settings, topics: e.target.value.split(',').map(t => t.trim())}
                    } : null)}
                    rows={3}
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>

                <Button 
                  onClick={async () => {
                    if (!agent) return;
                    try {
                      const response = await fetch('/api/agent/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          agentId: agent.id, 
                          settings: agent.settings 
                        }),
                      });
                      
                      if (!response.ok) throw new Error('Failed to save settings');
                      
                      setSuccess('Settings saved successfully!');
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to save settings');
                    }
                  }}
                  className="w-full"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Agent Control Center</h1>
        <p className="text-gray-600">Manage your AI agent's behavior on X (Twitter)</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/50 text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-950/50 text-green-400 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap relative">
          {AGENT_TABS.map((tab, index) => (
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
                  layoutId="agentTabHighlight"
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
    </div>
  );
};

export default Page;