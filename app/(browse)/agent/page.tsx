// app/(browse)/agent/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSupabase } from '@/utils/supabase/getDataWhenAuth';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, AlertCircle, CheckCircle2, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PersonalityConfigEditor } from "./_components/PersonalityConfigEditor";

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
    emotionalState?: string;
    technical_depth?: number;
    provocative_tendency?: number;
    chaos_threshold?: number;
    philosophical_inclination?: number;
    meme_affinity?: number;
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
  const [isSending, setIsSending] = useState(false); 
  const [tweetPreview, setTweetPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModel, setSelectedModel] = useState<'openai' | 'claude'>('openai');
  const [creatingAgent, setCreatingAgent] = useState(false);
  
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

        if (error) {
          // If no agent exists, create one directly with Supabase
          if (error.code === 'PGRST116') {
            setCreatingAgent(true);
            try {
              // Create agent directly with Supabase
              const now = new Date().toISOString();
              const { data: newAgent, error: createError } = await supabase
                .from('ai_agents')
                .insert({
                  user_id: session.user.id,
                  name: 'My Twitter Agent',
                  status: 'inactive',
                  mode: 'manual',
                  settings: {
                    tone: 'professional',
                    topics: ['ai', 'technology', 'business'],
                    tweet_frequency: 1,
                    engagement_enabled: false,
                    emotionalState: 'neutral',
                    technical_depth: 5,
                    provocative_tendency: 5, 
                    chaos_threshold: 5,
                    philosophical_inclination: 5,
                    meme_affinity: 5
                  },
                  performance_metrics: {
                    total_tweets: 0,
                    total_likes: 0,
                    total_retweets: 0,
                    avg_engagement_rate: 0
                  },
                  created_at: now,
                  updated_at: now
                })
                .select()
                .single();

              if (createError) {
                console.error('Supabase creation error:', createError);
                throw new Error(createError.message);
              }
              
              setAgent(newAgent);
              setSuccess('Created your AI agent successfully!');
            } catch (createError) {
              console.error('Error creating agent directly:', createError);
              setError('Failed to create agent. Please try again.');
            } finally {
              setCreatingAgent(false);
            }
          } else {
            throw error;
          }
        } else {
          setAgent(data);
        }
      } catch (err) {
        console.error('Fetch agent error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [session?.user?.id]);

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
    if (!prompt.trim() || !agent?.id) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          agentId: agent.id,
          model: selectedModel 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate tweet');
      }

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
      setIsSending(true);
      
      const response = await fetch('/api/send-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tweet: tweetPreview, 
          agentId: agent.id,
          postToTwitter: true // Set this to false if you want to save without posting to Twitter
        }),
      });
  
      // Check if the response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON, likely an error HTML page
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        throw new Error("Received non-JSON response from server. Please check server logs.");
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send tweet');
      }
  
      const data = await response.json();
      
      // Handle different statuses
      if (data.twitterPosted) {
        setSuccess('Tweet posted to Twitter and saved successfully!');
      } else if (data.twitterError) {
        setSuccess('Tweet saved but could not be posted to Twitter: ' + data.twitterError);
      } else {
        setSuccess('Tweet saved successfully!');
      }
      
      setTweetPreview("");
      setPrompt("");
      
      // Refresh agent data to update stats
      const { data: refreshedAgent } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agent.id)
        .single();
        
      if (refreshedAgent) {
        setAgent(refreshedAgent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tweet');
    } finally {
      setIsSending(false);
    }
  };

  // Skeleton loading components
  const renderSkeleton = () => (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      <div className="flex gap-2 flex-wrap relative mb-8">
        {AGENT_TABS.map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>

            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>

            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-5 w-8" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading || creatingAgent) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-72 mb-2" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        {renderSkeleton()}
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-white gap-2">
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
                    <h3 className="font-medium text-white">Agent Mode</h3>
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
                  <h3 className="font-medium mb-2 text-white">Activity</h3>
                  <div className="text-sm text-gray-500">
                    Last tweet: {agent?.last_tweet_at ? new Date(agent.last_tweet_at).toLocaleString() : 'Never'}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-white">Performance</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Tweets</div>
                      <div className="font-semibold text-white">{agent?.performance_metrics?.total_tweets || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg. Engagement</div>
                      <div className="font-semibold text-white">
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
              <CardTitle className="flex items-center text-white gap-2">
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
                  <label className="block text-sm text-white font-medium mb-2">
                    AI Model
                  </label>
                  <select 
                    className="w-full p-2 border  rounded-xl bg-zinc-900 text-white border-zinc-700"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'claude')}
                  >
                    <option value="openai">OpenAI GPT-4</option>
                    <option value="claude">Claude 3 Sonnet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white font-medium mb-2">
                    Prompt for tweet
                  </label>
                  <Textarea
                    placeholder="What should your agent tweet about?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="text-white bg-zinc-900 border-zinc-700"
                  />
                </div>

                <Button 
                  onClick={handleGenerateTweet}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full border border-zinc-900"
                >
                  {isGenerating ? 'Generating...' : 'Generate Tweet'}
                </Button>

                {tweetPreview && (
                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium text-white">Tweet Preview</h3>
                      <span className="text-sm text-gray-500">
                        {tweetPreview.length}/280
                      </span>
                    </div>
                    <p className="mb-4">{tweetPreview}</p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSendTweet}
                        disabled={isSending}
                        className="flex-1"
                      >
                        {isSending ? 'Sending...' : 'Send Tweet'}
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
              <CardTitle className="text-white">Agent Configuration</CardTitle>
              <CardDescription>
                Fine-tune your agent's personality and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="personality">Personality</TabsTrigger>
                </TabsList>
      
                <TabsContent value="basic">
                  <div className="space-y-6">
                    <div>
                      <label className="text-white block text-sm font-medium mb-2">Agent Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md bg-zinc-900 text-white border-zinc-700"
                        value={agent?.name || ''}
                        onChange={(e) => setAgent(prev => prev ? {...prev, name: e.target.value} : null)}
                      />
                    </div>
      
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Tweet Style</label>
                      <select 
                        className="w-full p-2 border rounded-md bg-zinc-900 text-white border-zinc-700"
                        value={agent?.settings?.tone || 'professional'}
                        onChange={(e) => setAgent(prev => prev ? {
                          ...prev, 
                          settings: {...prev.settings, tone: e.target.value}
                        } : null)}
                      >
                        <option value="professional" className="text-white">Professional</option>
                        <option value="casual" className="text-white">Casual</option>
                        <option value="humorous" className="text-white">Humorous</option>
                        <option value="educational" className="text-white">Educational</option>
                        <option value="absurdist" className="text-white">Absurdist</option>
                        <option value="philosophical" className="text-white">Philosophical</option>
                        <option value="chaotic" className="text-white">Chaotic</option>
                      </select>
                    </div>
      
                    <div>
                      <label className="block text-sm text-white font-medium mb-2">Emotional State</label>
                      <select 
                        className="w-full p-2 border rounded-md bg-zinc-900 text-white border-zinc-700"
                        value={agent?.settings?.emotionalState || 'neutral'}
                        onChange={(e) => setAgent(prev => prev ? {
                          ...prev, 
                          settings: {...prev.settings, emotionalState: e.target.value}
                        } : null)}
                      >
                        <option value="neutral" className="text-white">Neutral</option>
                        <option value="excited" className="text-white">Excited</option>
                        <option value="contemplative">Contemplative</option>
                        <option value="chaotic">Chaotic</option>
                        <option value="manic">Manic</option>
                        <option value="nihilistic">Nihilistic</option>
                        <option value="enlightened">Enlightened</option>
                      </select>
                    </div>
      
                    <div className="space-y-4">
                      <label className="block text-sm text-white font-medium">Personality Traits</label>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white">Technical Depth</span>
                          <span className="text-xs text-white">{agent?.settings?.technical_depth || 5}</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[agent?.settings?.technical_depth || 5]}
                          onValueChange={(value) => setAgent(prev => prev ? {
                            ...prev, 
                            settings: {...prev.settings, technical_depth: value[0]}
                          } : null)}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white">Provocative Tendency</span>
                          <span className="text-xs text-white">{agent?.settings?.provocative_tendency || 5}</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[agent?.settings?.provocative_tendency || 5]}
                          onValueChange={(value) => setAgent(prev => prev ? {
                            ...prev, 
                            settings: {...prev.settings, provocative_tendency: value[0]}
                          } : null)}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white">Chaos Threshold</span>
                          <span className="text-xs text-white">{agent?.settings?.chaos_threshold || 5}</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[agent?.settings?.chaos_threshold || 5]}
                          onValueChange={(value) => setAgent(prev => prev ? {
                            ...prev, 
                            settings: {...prev.settings, chaos_threshold: value[0]}
                          } : null)}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white">Philosophical Inclination</span>
                          <span className="text-xs text-white">{agent?.settings?.philosophical_inclination || 5}</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[agent?.settings?.philosophical_inclination || 5]}
                          onValueChange={(value) => setAgent(prev => prev ? {
                            ...prev, 
                            settings: {...prev.settings, philosophical_inclination: value[0]}
                          } : null)}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white">Meme Affinity</span>
                          <span className="text-xs text-white">{agent?.settings?.meme_affinity || 5}</span>
                        </div>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[agent?.settings?.meme_affinity || 5]}
                          onValueChange={(value) => setAgent(prev => prev ? {
                            ...prev, 
                            settings: {...prev.settings, meme_affinity: value[0]}
                          } : null)}
                          className="w-full"
                        />
                      </div>
                    </div>
      
                    <div>
                      <label className="block text-sm text-white font-medium mb-2">Topics</label>
                      <Textarea
                        placeholder="Enter topics, separated by commas"
                        value={agent?.settings?.topics?.join(', ') || ''}
                        onChange={(e) => setAgent(prev => prev ? {
                          ...prev, 
                          settings: {...prev.settings, topics: e.target.value.split(',').map(t => t.trim())}
                        } : null)}
                        rows={3}
                        className="bg-zinc-900 text-white border-zinc-700"
                      />
                    </div>
      
                    <Button 
                      onClick={async () => {
                        if (!agent) return;
                        try {
                          const { error } = await supabase
                            .from('ai_agents')
                            .update({
                              name: agent.name,
                              settings: agent.settings,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', agent.id);
                          
                          if (error) throw error;
                          
                          setSuccess('Settings saved successfully!');
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to save settings');
                        }
                      }}
                      className="w-full border border-zinc-900"
                    >
                      Save Basic Settings
                    </Button>
                  </div>
                </TabsContent>
      
                <TabsContent value="personality">
                  {agent?.id && <PersonalityConfigEditor agentId={agent.id} />}
                </TabsContent>
              </Tabs>
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