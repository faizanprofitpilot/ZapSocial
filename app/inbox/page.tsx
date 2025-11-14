import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InboxView, InboxFilterGroup, InboxMessage } from "@/components/inbox/InboxView";

const filterGroups: InboxFilterGroup[] = [
  {
    id: "channels",
    label: "Channels",
    items: [
      { id: "instagram", label: "Instagram", color: "border-pink-400/40 bg-pink-500/15 text-pink-200" },
      { id: "linkedin", label: "LinkedIn", color: "border-blue-400/40 bg-blue-500/15 text-blue-200" },
      { id: "facebook", label: "Facebook", color: "border-blue-600/40 bg-blue-600/15 text-blue-200" },
      { id: "x", label: "X", color: "border-gray-400/40 bg-gray-500/20 text-gray-200" },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    items: [
      { id: "product", label: "Product Launch", color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
      { id: "support", label: "Support", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
      { id: "priority", label: "Priority", color: "border-rose-400/40 bg-rose-500/15 text-rose-200" },
    ],
  },
];

const inboxMessages: InboxMessage[] = [
  {
    id: "msg-1",
    sender: "Ava Chen",
    handle: "avachen",
    platform: "Instagram",
    preview: "Loved the latest post! Could we get the promo code for our followers?",
    timestamp: "2m ago",
    status: "open",
    unread: true,
    tags: [
      { id: "product", label: "Product Launch", color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
    ],
    type: "message",
    thread: [
      {
        id: "th-1",
        author: "client",
        name: "Ava Chen",
        avatarColor: "linear-gradient(135deg,#f97316,#facc15)",
        content: "Loved the momentum on your latest product reel! Could we share the promo code with our community?",
        timestamp: "Today • 9:42 AM",
      },
      {
        id: "th-2",
        author: "teammate",
        name: "Jordan (ZapSocial)",
        avatarColor: "linear-gradient(135deg,#38bdf8,#6366f1)",
        content: "Hey Ava! Absolutely – let me pull that for you.",
        timestamp: "Today • 9:45 AM",
      },
    ],
  },
  {
    id: "msg-2",
    sender: "Nova Media",
    handle: "novamedia",
    platform: "LinkedIn",
    preview: "Analytics request: can we get a weekly snapshot of engagement?",
    timestamp: "18m ago",
    status: "open",
    unread: false,
    tags: [
      { id: "support", label: "Support", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
    ],
    type: "message",
    thread: [
      {
        id: "th-3",
        author: "client",
        name: "Nova Media",
        avatarColor: "linear-gradient(135deg,#ec4899,#a855f7)",
        content: "Could you send over a weekly snapshot of engagement for LinkedIn?",
        timestamp: "Today • 8:11 AM",
      },
      {
        id: "th-4",
        author: "me",
        name: "You",
        avatarColor: "linear-gradient(135deg,#3b82f6,#22d3ee)",
        content: "Working on it – will share the dashboard shortly!",
        timestamp: "Today • 8:35 AM",
      },
    ],
  },
  {
    id: "msg-3",
    sender: "Orbit Studio",
    handle: "orbitstudio",
    platform: "Facebook",
    preview: "Community question: any teaser we can share for next week’s launch?",
    timestamp: "1h ago",
    status: "resolved",
    unread: false,
    tags: [
      { id: "priority", label: "Priority", color: "border-rose-400/40 bg-rose-500/15 text-rose-200" },
    ],
    type: "message",
    thread: [
      {
        id: "th-5",
        author: "client",
        name: "Orbit Studio",
        avatarColor: "linear-gradient(135deg,#f43f5e,#fb7185)",
        content: "Any teaser we can share for next week’s launch? Our subscribers are asking!",
        timestamp: "Yesterday • 4:20 PM",
      },
      {
        id: "th-6",
        author: "teammate",
        name: "Mira (ZapSocial)",
        avatarColor: "linear-gradient(135deg,#22d3ee,#6366f1)",
        content: "Sent over a teaser clip + caption in the shared drive. Let us know if you need tweaks!",
        timestamp: "Yesterday • 4:42 PM",
      },
    ],
  },
  {
    id: "msg-4",
    sender: "Jessie Patel",
    handle: "jessiecreates",
    platform: "Instagram",
    preview: "Commented: “This carousel is 🔥! Can we share it with credit?”",
    timestamp: "3h ago",
    status: "open",
    unread: true,
    tags: [
      { id: "product", label: "Product Launch", color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
    ],
    type: "comment",
    context: {
      postTitle: "Behind-the-scenes reel teaser",
    },
    thread: [
      {
        id: "th-7",
        author: "client",
        name: "Jessie Patel",
        avatarColor: "linear-gradient(135deg,#f59e0b,#f97316)",
        content: "This carousel is 🔥! Mind if we repost it with credit on our community page?",
        timestamp: "Today • 6:05 AM",
      },
      {
        id: "th-8",
        author: "me",
        name: "You",
        avatarColor: "linear-gradient(135deg,#3b82f6,#22d3ee)",
        content: "Thanks Jessie! Absolutely, we’ll send over a version with your watermark shortly.",
        timestamp: "Today • 6:18 AM",
      },
    ],
  },
  {
    id: "msg-5",
    sender: "Orbit Studio",
    handle: "orbitstudio",
    platform: "Facebook",
    preview: "Commented: “Can we get a quote graphic for tomorrow?”",
    timestamp: "Yesterday",
    status: "open",
    unread: false,
    tags: [
      { id: "support", label: "Support", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
    ],
    type: "comment",
    context: {
      postTitle: "Customer testimonial quote",
    },
    thread: [
      {
        id: "th-9",
        author: "client",
        name: "Orbit Studio",
        avatarColor: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        content: "Can we get a quote graphic for tomorrow? The audience loved the last one!",
        timestamp: "Yesterday • 11:10 AM",
      },
      {
        id: "th-10",
        author: "teammate",
        name: "Mira (ZapSocial)",
        avatarColor: "linear-gradient(135deg,#22d3ee,#6366f1)",
        content: "On it! Drafting a square version right now.",
        timestamp: "Yesterday • 11:30 AM",
      },
    ],
  },
];

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
      <InboxView filters={filterGroups} messages={inboxMessages} />
    </div>
  );
}
