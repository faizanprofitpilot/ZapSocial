"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, MessageSquare, Trash2, Plus, Loader2, Menu, X as XIcon, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export default function AICMOPage() {
  // Create Supabase client only at runtime, never during build
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Supabase client only in useEffect (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSupabase(createClient());
      } catch (error) {
        console.error('Failed to create Supabase client:', error);
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sendingMessage]);

  const loadConversations = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  }, [supabase]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, [supabase]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    } else {
      setMessages([]);
    }
  }, [currentConversation, loadMessages]);

  const createNewConversation = async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: "New Conversation",
        })
        .select()
        .single();

      if (error) throw error;
      setConversations((prev) => [data, ...prev]);
      setCurrentConversation(data.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId);

      if (error) throw error;
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title } : c))
      );
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendingMessage || !supabase) return;

    const userMessage = input.trim();
    setInput("");
    setSendingMessage(true);

    // Create conversation if none exists
    let conversationId = currentConversation;
    if (!conversationId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: userMessage.trim().substring(0, 50) || "New Conversation",
          })
          .select()
          .single();

        if (error) throw error;
        conversationId = data.id;
        setCurrentConversation(data.id);
        setConversations((prev) => [data, ...prev]);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        setSendingMessage(false);
        return;
      }
    }

    // Add user message to UI
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message to database
    try {
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content: userMessage,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation title if it's still the default
      if (conversationId) {
        let conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) {
          const { data } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", conversationId)
            .single();
          conversation = data;
        }
        if (conversation && conversation.title === "New Conversation") {
          const newTitle = userMessage.substring(0, 50).trim() || "New Conversation";
          await updateConversationTitle(conversationId, newTitle);
        }
      }

      // Get AI response
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant message to UI
      const assistantMsg: Message = {
        id: `temp-${Date.now() + 1}`,
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to database
      const { error: assistantError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: data.response,
        });

      if (assistantError) throw assistantError;

      // Reload conversations to update updated_at
      await loadConversations();
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const suggestedPrompts = [
    "How can I improve my social media engagement?",
    "What's the best content strategy for small businesses?",
    "How do I create a social media calendar?",
    "What are the best times to post on Instagram?",
    "How can I grow my LinkedIn following?",
    "What's the best way to promote a product launch?",
  ];

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex h-full relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* History Button - Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={() => setShowConversations(!showConversations)}
            className="rounded-full h-10 w-10 p-0 border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
            title="Conversation History"
          >
            <History className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-2xl px-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-purple-500 to-cyan-500 shadow-lg shadow-brand-500/30">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-xl lg:text-2xl font-semibold text-white mb-2">
                  Your AI Chief Marketing Officer
                </h2>
                <p className="text-sm lg:text-base text-gray-300 mb-1">
                  Tailored for your brand
                </p>
                <p className="text-xs lg:text-sm text-gray-400 mb-6 max-w-xl mx-auto leading-relaxed">
                  💡 I track your social performance, audience behavior, content history, and business niche to give you data-driven marketing strategy.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(prompt)}
                      className="text-left p-3 rounded-xl border border-white/10 bg-white/5 text-xs lg:text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto pb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] lg:max-w-[80%] rounded-2xl p-3 lg:p-4",
                      msg.role === "user"
                        ? "bg-gradient-to-r from-brand-500 to-purple-500 text-white"
                        : "glass-base glass-mid border border-white/10 text-gray-200"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="glass-base glass-mid border border-white/10 rounded-2xl p-3 lg:p-4 text-gray-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 lg:p-6 border-t border-white/10 bg-[#0f172a]">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto">
            <div className="flex gap-2 lg:gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI CMO about marketing strategy..."
                className="flex-1 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-brand-400/50 text-sm lg:text-base"
                disabled={sendingMessage}
              />
              <Button
                type="submit"
                disabled={sendingMessage || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-brand-500 to-purple-500 hover:from-brand-600 hover:to-purple-600 px-4 lg:px-6"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Desktop Overlay when sidebar is open */}
      {showConversations && (
        <div
          className="hidden lg:block fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowConversations(false)}
        />
      )}

      {/* Conversations Sidebar - Right Side (Desktop) */}
      <div
        className={cn(
          "hidden lg:flex lg:flex-col fixed top-16 right-0 bottom-0 w-80 border-l border-white/10 bg-[#0f172a] z-40 transition-transform duration-300 ease-in-out",
          showConversations ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={createNewConversation}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
            <Button
              onClick={() => setShowConversations(false)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No conversations yet. Start a new conversation to begin!
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors",
                  currentConversation === conversation.id
                    ? "bg-brand-500/20 border border-brand-400/40"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
                onClick={() => {
                  setCurrentConversation(conversation.id);
                }}
              >
                <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Conversations Drawer */}
      {showConversations && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowConversations(false)}
        />
      )}
      <div
        className={cn(
          "fixed lg:hidden top-16 bottom-0 right-0 z-50 flex flex-col w-80 border-l border-white/10 bg-[#0f172a] transition-transform duration-300 ease-in-out",
          showConversations ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={createNewConversation}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
            <Button
              onClick={() => setShowConversations(false)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No conversations yet. Start a new conversation to begin!
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors",
                  currentConversation === conversation.id
                    ? "bg-brand-500/20 border border-brand-400/40"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
                onClick={() => {
                  setCurrentConversation(conversation.id);
                  setShowConversations(false);
                }}
              >
                <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
