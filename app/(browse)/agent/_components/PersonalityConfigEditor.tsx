// app/(browse)/agent/_components/PersonalityConfigEditor.tsx
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface PersonalityConfigEditorProps {
  agentId: string;
}

export function PersonalityConfigEditor({ agentId }: PersonalityConfigEditorProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personalityCoreTraits, setPersonalityCoreTraits] = useState('');
  const [tweetStyles, setTweetStyles] = useState('');
  const [tweetRules, setTweetRules] = useState('');
  const [criticalRules, setCriticalRules] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId || !session?.user) return;

    async function fetchPersonalityConfig() {
      try {
        setLoading(true);
        const response = await fetch(`/api/agent/personality-config?agentId=${agentId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch personality configuration');
        }

        const data = await response.json();
        
        // Convert arrays to multiline strings
        setPersonalityCoreTraits(data.personalityCoreTraits.join('\n'));
        setTweetStyles(data.tweetStyles.join('\n'));
        setTweetRules(data.tweetRules.join('\n'));
        setCriticalRules(data.criticalRules.join('\n'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load personality configuration');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPersonalityConfig();
  }, [agentId, session?.user]);

  const handleSave = async () => {
    if (!agentId || !session?.user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/agent/personality-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          personalityCoreTraits,
          tweetStyles,
          tweetRules,
          criticalRules
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save personality configuration');
      }

      setSuccess('Personality configuration saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save personality configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-3/4 mx-auto"></div>
          <div className="h-20 bg-zinc-800 rounded"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto"></div>
          <div className="h-20 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-950/50 text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-950/50 text-green-400 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="text-sm text-zinc-400 mb-4">
        Customize your agent's personality by editing the prompts below. Each line represents a new instruction for the AI.
      </div>

      <Accordion type="single" collapsible defaultValue="personality-core-traits">
        <AccordionItem value="personality-core-traits">
          <AccordionTrigger className="text-white">Personality Core Traits</AccordionTrigger>
          <AccordionContent>
            <Textarea 
              value={personalityCoreTraits}
              onChange={(e) => setPersonalityCoreTraits(e.target.value)}
              className="min-h-[300px] bg-zinc-900 text-white border-zinc-700 font-mono text-sm"
              placeholder="Enter personality core traits, one per line"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tweet-styles">
          <AccordionTrigger className="text-white">Tweet Styles</AccordionTrigger>
          <AccordionContent>
            <Textarea 
              value={tweetStyles}
              onChange={(e) => setTweetStyles(e.target.value)}
              className="min-h-[300px] bg-zinc-900 text-white border-zinc-700 font-mono text-sm"
              placeholder="Enter tweet styles, one per line"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tweet-rules">
          <AccordionTrigger className="text-white">Tweet Rules</AccordionTrigger>
          <AccordionContent>
            <Textarea 
              value={tweetRules}
              onChange={(e) => setTweetRules(e.target.value)}
              className="min-h-[300px] bg-zinc-900 text-white border-zinc-700 font-mono text-sm"
              placeholder="Enter tweet rules, one per line"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="critical-rules">
          <AccordionTrigger className="text-white">Critical Rules</AccordionTrigger>
          <AccordionContent>
            <Textarea 
              value={criticalRules}
              onChange={(e) => setCriticalRules(e.target.value)}
              className="min-h-[300px] bg-zinc-900 text-white border-zinc-700 font-mono text-sm"
              placeholder="Enter critical rules, one per line"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        onClick={handleSave}
        disabled={saving || !agentId}
        className="w-full border border-zinc-900"
      >
        {saving ? 'Saving...' : 'Save Personality Configuration'}
      </Button>
    </div>
  );
}