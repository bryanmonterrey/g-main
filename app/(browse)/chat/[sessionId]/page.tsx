'use client';

import { useParams } from 'next/navigation';
import { useChatStore } from '@/store/useChatStore';

import { redirect } from 'next/navigation';

import { ChatSession } from '@/components/chat/ChatSession';

export default function ChatPage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);
  const { getSessionById } = useChatStore();
  
  const session = getSessionById(sessionId);
  
  if (!session) {
    redirect('/');
  }

  return <ChatSession sessionId={sessionId} initialMessages={session.messages} />;
} 