"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  MessageCircle,
  Send,
  Sparkles,
  Tag,
  Paperclip,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FiltersDropdown } from "./FiltersDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type InboxTag = {
  id: string;
  label: string;
  color: string;
};

export type InboxFilterGroup = {
  id: string;
  label: string;
  items: InboxTag[];
};

export type InboxThreadMessage = {
  id: string;
  author: "client" | "teammate" | "me";
  name: string;
  avatarColor: string;
  content: string;
  timestamp: string;
  attachments?: string[];
};

export type InboxMessage = {
  id: string;
  sender: string;
  handle: string;
  platform: string;
  preview: string;
  timestamp: string;
  status: "open" | "resolved";
  unread: boolean;
  tags: InboxTag[];
  thread: InboxThreadMessage[];
  type?: "message" | "comment";
  context?: {
    postTitle?: string;
  };
  avatarColor?: string;
};

interface InboxViewProps {
  filters: InboxFilterGroup[];
  messages: InboxMessage[];
}

const statusStyles: Record<InboxMessage["status"], string> = {
  open: "border-amber-400/40 bg-amber-500/10",
  resolved: "border-emerald-400/40 bg-emerald-500/10",
};

const platformLogos: Record<string, string> = {
  instagram: "/Instagram logo.png",
  linkedin: "/Linkedin logo.png",
  facebook: "/Facebook logo.png",
};

const placeholderAvatars: Record<string, string> = {
  "msg-1": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=facearea&w=120&h=120&q=80",
  "msg-2": "https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=facearea&w=120&h=120&q=80",
  "msg-3": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=120&h=120&q=80",
  "msg-4": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=120&h=120&q=80",
  "msg-5": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=120&h=120&q=80",
  default: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=120&h=120&q=80",
};

export function InboxView({ filters, messages }: InboxViewProps) {
  const router = useRouter();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [selectedMessage, setSelectedMessage] = useState(messages[0]?.id ?? "");
  const [reply, setReply] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toggleTypeFilter = (id: string) => {
    setTypeFilters((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const removeFilter = (id: string) => {
    // Check if it's a type filter
    if (id === "message" || id === "comment") {
      setTypeFilters((prev) => prev.filter((value) => value !== id));
    } else {
      // It's an active filter (tag, channel, or status)
      setActiveFilters((prev) => prev.filter((value) => value !== id));
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setTypeFilters([]);
  };

  // Get all filter items from all groups for chip rendering
  const allFilterItems = useMemo(() => {
    const items: Array<{ id: string; label: string; groupId: string }> = [];
    filters.forEach((group) => {
      group.items.forEach((item) => {
        items.push({ id: item.id, label: item.label, groupId: group.id });
      });
    });
    return items;
  }, [filters]);

  // Get active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string }> = [];
    
    // Add active filters (tags, channels, status)
    activeFilters.forEach((filterId) => {
      if (filterId.startsWith("status-")) {
        // Handle status filters
        const statusLabel = filterId.replace("status-", "");
        chips.push({ id: filterId, label: statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1) });
      } else {
        // Handle tags and channels
        const item = allFilterItems.find((item) => item.id === filterId);
        if (item) {
          chips.push({ id: filterId, label: item.label });
        }
      }
    });
    
    // Add type filters
    typeFilters.forEach((filterId) => {
      const typeLabels: Record<string, string> = {
        message: "Messages",
        comment: "Comments",
      };
      chips.push({ id: filterId, label: typeLabels[filterId] || filterId });
    });
    
    return chips;
  }, [activeFilters, typeFilters, allFilterItems]);

  const filteredMessages = useMemo(() => {
    let result = messages;

    // Filter by tags/channels
    const tagFilters = activeFilters.filter((f) => !f.startsWith("status-"));
    if (tagFilters.length > 0) {
      result = result.filter((message) => {
        // Check if message has any matching tags
        const hasMatchingTag = message.tags.some((tag) => tagFilters.includes(tag.id));
        
        // Check if filter matches platform (case-insensitive)
        const hasMatchingPlatform = tagFilters.some((filterId) => {
          const platformName = filterId.toLowerCase();
          return message.platform.toLowerCase() === platformName;
        });
        
        return hasMatchingTag || hasMatchingPlatform;
      });
    }

    // Filter by status
    const statusFilters = activeFilters.filter((f) => f.startsWith("status-"));
    if (statusFilters.length > 0) {
      result = result.filter((message) => {
        const messageStatus = `status-${message.status}`;
        return statusFilters.includes(messageStatus);
      });
    }

    // Filter by type
    if (typeFilters.length > 0) {
      result = result.filter((message) => {
        const messageType = message.type ?? "message";
        return typeFilters.includes(messageType);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (message) =>
          message.sender.toLowerCase().includes(query) ||
          message.handle.toLowerCase().includes(query) ||
          message.preview.toLowerCase().includes(query) ||
          message.platform.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeFilters, typeFilters, messages, searchQuery]);

  const activeMessage = filteredMessages.find((message) => message.id === selectedMessage) ?? filteredMessages[0];

  const renderMessageTags = (message: InboxMessage) => {
    const statusTag = {
      id: `status-${message.status}`,
      label: message.status,
      className: cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        statusStyles[message.status]
      ),
    };

    const secondaryTag = message.type === "comment" ? "Comment" : "Message";

    return (
      <div className="flex items-center gap-2">
        <span className={statusTag.className}>{statusTag.label}</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          {secondaryTag}
        </span>
        {message.unread && (
          <span className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            New
          </span>
        )}
      </div>
    );
  };

  const renderMessageCard = (message: InboxMessage) => {
    const isActive = selectedMessage === message.id;
    const avatarGradient = message.avatarColor ?? "linear-gradient(135deg,#3b82f6,#22d3ee)";
    const avatarImage = placeholderAvatars[message.id] ?? placeholderAvatars.default;

    return (
      <button
        key={message.id}
        onClick={() => setSelectedMessage(message.id)}
        className={cn(
          "flex w-full flex-col gap-3 rounded-2xl border px-4 py-3 text-left transition",
          isActive
            ? "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_24px_rgba(59,130,246,0.35)]"
            : "border-white/10 bg-white/5 hover:border-white/20"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full"
              style={{
                background: avatarGradient,
                backgroundImage: `url(${avatarImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div>
              <p className="text-sm font-medium text-white">{message.sender}</p>
              <p className="text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  @{message.handle}
                  <span className="text-gray-500">•</span>
                  {platformLogos[message.platform.toLowerCase()] ? (
                    <Image
                      src={platformLogos[message.platform.toLowerCase()]}
                      alt={message.platform}
                      width={12}
                      height={12}
                      className="inline-block object-contain"
                    />
                  ) : null}
                  {message.platform}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderMessageTags(message)}
          <span className="ml-auto text-xs text-gray-400">{message.timestamp}</span>
        </div>
        <p className="line-clamp-2 text-sm leading-snug text-gray-300">{message.preview}</p>
      </button>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
      {/* Message list */}
      <section className="glass-base glass-high flex h-[600px] flex-col gap-4 rounded-3xl p-5 shadow-lg shadow-black/30">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-300">Inbox</p>
            <h2 className="text-lg font-semibold text-white">Messages & Comments</h2>
          </div>
          <FiltersDropdown
            filters={filters}
            activeFilters={activeFilters}
            typeFilters={typeFilters}
            onToggleFilter={toggleFilter}
            onToggleTypeFilter={toggleTypeFilter}
            onClearAll={clearAllFilters}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-cyan-400/50"
          />
        </div>

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => removeFilter(chip.id)}
                className="group flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/30"
              >
                <span>{chip.label}</span>
                <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}

        {/* Message List */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => renderMessageCard(message))
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-sm text-gray-400">
              No messages found
            </div>
          )}
        </div>
      </section>

      {/* Chat thread */}
      <section className="glass-base glass-mid flex h-[600px] flex-col gap-4 rounded-3xl p-5 shadow-lg shadow-black/30 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-300">Chat</p>
            <h2 className="text-lg font-semibold text-white">Thread</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <Tag className="h-3.5 w-3.5" />
            {activeMessage?.platform && platformLogos[activeMessage.platform.toLowerCase()] ? (
              <Image
                src={platformLogos[activeMessage.platform.toLowerCase()]}
                alt={activeMessage.platform}
                width={14}
                height={14}
                className="object-contain"
              />
            ) : null}
            {activeMessage?.platform ?? ""}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {activeMessage ? (
            activeMessage.thread.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full flex-col gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  message.author === "me"
                    ? "self-end border-cyan-400/40 bg-cyan-500/10"
                    : "border-white/10 bg-white/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: message.avatarColor }}
                  >
                    {message.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{message.name}</p>
                    <p className="text-xs text-gray-400">{message.timestamp}</p>
                  </div>
                </div>
                <p className="text-sm text-white">{message.content}</p>
                {message.attachments && (
                  <div className="flex items-center gap-2">
                    {message.attachments.map((attachment) => (
                      <span
                        key={attachment}
                        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-200"
                      >
                        <Paperclip className="h-3 w-3" /> {attachment}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-sm text-gray-400">
              Select a message to view the thread
            </div>
          )}
        </div>

        <div className="mt-2 flex-shrink-0 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <textarea
            className="w-full rounded-2xl border border-white/10 bg-transparent p-3 text-sm text-white focus:outline-none"
            placeholder="Type your reply here..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{reply.length} characters</span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-white hover:border-cyan-400 hover:bg-cyan-500/30">
                <Sparkles className="h-3.5 w-3.5" /> Create AI Reply
              </button>
              <button className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:border-white/20">
                <Paperclip className="h-3.5 w-3.5" /> Attach
              </button>
              <button className="flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-white hover:border-cyan-400 hover:bg-cyan-500/30">
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
