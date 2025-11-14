"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";

type Suggestion = {
  platform: string;
  caption: string;
  hashtags: string[];
};

export default function CopilotPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; platform?: string }>>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const suggestedPrompts = [
    "What's the best time to post on Instagram for my target audience?",
    "How can I increase engagement on my LinkedIn posts?",
    "What content strategy works best for small businesses?",
    "How do I create a content calendar for the next month?",
    "What hashtags should I use for my industry?",
    "How can I convert more followers into customers?",
    "What's the best way to promote a new product launch?",
    "How do I improve my social media ROI?",
  ];

  const handlePromptClick = async (prompt: string) => {
    setInput(prompt);
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      setInput("");
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}. Please try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load suggested posts on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch("/api/copilot/suggestions");
        const data = await response.json();
        
        if (response.ok && data.suggestions) {
          setSuggestions(data.suggestions);
          // Add welcome message
          setMessages([
            {
              role: "assistant",
              content: "Welcome to AI Playground! Here are some suggested posts for you. Click 'Create' on any suggestion to schedule or post it. You can also ask me anything about marketing strategy!",
            },
          ]);
        } else {
          setMessages([
            {
              role: "assistant",
              content: "Welcome to AI Playground! Connect your Google Business Profile in Integrations to get personalized post suggestions. You can also ask me anything about marketing strategy!",
            },
          ]);
        }
      } catch (error) {
        setMessages([
          {
            role: "assistant",
            content: "Welcome to AI Playground! Connect your Google Business Profile in Integrations to get personalized post suggestions. You can also ask me anything about marketing strategy!",
          },
        ]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    loadSuggestions();
  }, []);

  const handleCreatePost = (suggestion: Suggestion) => {
    // Navigate to dashboard with pre-filled data
    const params = new URLSearchParams({
      platform: suggestion.platform,
      caption: suggestion.caption,
      hashtags: suggestion.hashtags.join(","),
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  const getPlatformLogo = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "/Instagram logo.png";
      case "linkedin":
        return "/Linkedin logo.png";
      case "x":
        return "/X logo.png";
      case "facebook":
        return "/Facebook logo.png";
      default:
        return null;
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "Instagram";
      case "linkedin":
        return "LinkedIn";
      case "x":
        return "X (Twitter)";
      case "facebook":
        return "Facebook";
      default:
        return platform;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}. Please try again.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="md:flex md:gap-8">
          <Sidebar />
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-gray-50 mb-2 flex items-center gap-2">
                <Sparkles className="w-8 h-8" />
                AI Playground
              </h2>
              <p className="text-gray-300">
                Get AI-suggested posts based on your business and ask marketing strategy questions
              </p>
            </div>

            {/* Suggested Posts Section */}
            {suggestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-50 mb-4">Suggested Posts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((suggestion, idx) => {
                    const logo = getPlatformLogo(suggestion.platform);
                    return (
                      <Card key={idx} className="glass-light border border-white/10 hover:border-white/20 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {logo && (
                              <div className="w-12 h-12 relative flex-shrink-0">
                                <Image
                                  src={logo}
                                  alt={suggestion.platform}
                                  width={48}
                                  height={48}
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                            )}
                            <h4 className="font-semibold text-gray-50 text-sm">
                              {getPlatformLabel(suggestion.platform)}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                            {suggestion.caption}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {suggestion.hashtags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs text-brand-400">
                                #{tag}
                              </span>
                            ))}
                            {suggestion.hashtags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{suggestion.hashtags.length - 3} more
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleCreatePost(suggestion)}
                          >
                            Create
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <Card className="flex flex-col" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
              <CardHeader className="flex-shrink-0">
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 px-6 pb-4"
                  style={{ maxHeight: "calc(100vh - 500px)" }}
                >
                  {suggestionsLoading && (
                    <div className="flex justify-start">
                      <div className="glass-light rounded-lg p-4 text-gray-200">
                        <p className="text-sm">Loading suggestions...</p>
                      </div>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.role === "user"
                            ? "bg-gradient-brand text-white"
                            : "glass-light text-gray-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="glass-light rounded-lg p-4 text-gray-200">
                        <p className="text-sm">Thinking...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Suggested Prompts */}
                {!loading && messages.length <= 1 && (
                  <div className="px-6 pb-4 flex-shrink-0">
                    <p className="text-xs text-gray-400 mb-2">Suggested prompts for small business marketing:</p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {suggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePromptClick(prompt)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-gray-100 transition-all whitespace-nowrap"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-6 pb-6 pt-4 border-t border-white/10 flex-shrink-0">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about marketing strategy, content ideas, or anything else..."
                      className="flex-1"
                      disabled={loading || suggestionsLoading}
                    />
                    <Button type="submit" disabled={loading || !input.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

