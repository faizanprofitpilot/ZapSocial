"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostPreviewPanel } from "@/components/dashboard/PostPreviewPanel";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  ChevronDown,
  Loader2,
  PenLine,
  Repeat,
  Save,
  Sparkles,
  Zap,
  Upload,
  Wand2,
  X as CloseIcon,
  ArrowRight,
  Minus,
  Plus,
  Heart,
  Briefcase,
  Smile,
  Play,
  Target,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Platform = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  logo?: string;
  gradient: string;
};

type GeneratedPost = {
  id: string;
  caption: string;
  hashtags: string[];
  platform: string;
  tone: string;
};

const platforms: Platform[] = [
  { id: "instagram", label: "Instagram", logo: "/Instagram logo.png", gradient: "from-pink-500 to-rose-500" },
  { id: "linkedin", label: "LinkedIn", logo: "/Linkedin logo.png", gradient: "from-blue-500 to-blue-600" },
  { id: "facebook", label: "Facebook", logo: "/Facebook logo.png", gradient: "from-blue-600 to-blue-700" },
];

const tones = ["friendly", "professional", "witty", "playful", "persuasive"] as const;

const platformWordLimits: Record<string, number> = {
  instagram: 150,
  facebook: 220,
  linkedin: 300,
};

const upcomingOccasions = [
  { month: 0, day: 1, label: "new year kickoff" },
  { month: 1, day: 14, label: "valentines shoutout" },
  { month: 4, day: 5, label: "cinco de mayo" },
  { month: 6, day: 4, label: "independence day" },
  { month: 9, day: 31, label: "halloween teaser" },
  { month: 10, day: 11, label: "veterans day post" },
  { month: 10, day: 28, label: "giving tuesday" },
  { month: 11, day: 25, label: "holiday hours" },
];

type AiAction = {
  id: string;
  label: string;
  type: "rewrite_x" | "rephrase" | "shorten" | "expand" | "tone" | "generate_image";
  meta?: string;
  icon?: React.ReactNode;
};

const toneIcons: Record<string, React.ReactNode> = {
  friendly: <Heart className="h-3.5 w-3.5" />,
  professional: <Briefcase className="h-3.5 w-3.5" />,
  witty: <Smile className="h-3.5 w-3.5" />,
  playful: <Play className="h-3.5 w-3.5" />,
  persuasive: <Target className="h-3.5 w-3.5" />,
};

const aiActionSections: { label: string; icon: React.ReactNode; actions: AiAction[] }[] = [
  {
    label: "Rewrite",
    icon: <Repeat className="h-4 w-4" />,
    actions: [
      { id: "rewrite-x", label: "Rewrite for X", type: "rewrite_x", icon: <ArrowRight className="h-3.5 w-3.5" /> },
      { id: "rewrite-linkedin", label: "Rewrite for LinkedIn", type: "rewrite_x", meta: "linkedin", icon: <ArrowRight className="h-3.5 w-3.5" /> },
      { id: "rewrite-instagram", label: "Rewrite for Instagram", type: "rewrite_x", meta: "instagram", icon: <ArrowRight className="h-3.5 w-3.5" /> },
      { id: "rewrite-facebook", label: "Rewrite for Facebook", type: "rewrite_x", meta: "facebook", icon: <ArrowRight className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: "Tone",
    icon: <Sparkles className="h-4 w-4" />,
    actions: tones.map((tone) => ({ 
      id: `tone-${tone}`, 
      label: tone, 
      type: "tone", 
      meta: tone,
      icon: toneIcons[tone] || <Sparkles className="h-3.5 w-3.5" />
    })),
  },
  {
    label: "Length",
    icon: <PenLine className="h-4 w-4" />,
    actions: [
      { id: "shorten", label: "Shorten", type: "shorten", icon: <Minus className="h-3.5 w-3.5" /> },
      { id: "expand", label: "Expand", type: "expand", icon: <Plus className="h-3.5 w-3.5" /> },
    ],
  },
];

const generateImageAction: AiAction = {
  id: "generate-image",
  label: "Generate AI Image",
  type: "generate_image",
};

export function AIComposer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [caption, setCaption] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("friendly");
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [includeEmojis, setIncludeEmojis] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imagePreviewRef = useRef<string[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleCalendarDate, setScheduleCalendarDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedLinkedInOrgId, setSelectedLinkedInOrgId] = useState<string | null>(null);
  const [publishResults, setPublishResults] = useState<Array<{ platform: string; success: boolean; error?: string }>>([]);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const numberOfPosts = Math.max(1, Math.min(5, selectedPlatforms.length || 1));
  const wordLimit = useMemo(() => {
    if (selectedPlatforms.length === 0) return 150;
    const limits = selectedPlatforms.map((platform) => platformWordLimits[platform] ?? 150);
    return Math.min(...limits);
  }, [selectedPlatforms]);

  const wordCount = useMemo(() => {
    const tokens = caption.trim().split(/\s+/).filter(Boolean);
    return caption.trim().length === 0 ? 0 : tokens.length;
  }, [caption]);

  const upcomingIdeas = useMemo(() => {
    const now = new Date();
    const seasonal = upcomingOccasions
      .filter((item) => item.month === now.getMonth() && item.day >= now.getDate())
      .slice(0, 2)
      .map((item) => item.label);

    if (seasonal.length === 0) {
      const next = upcomingOccasions.find((item) => item.month === now.getMonth());
      if (next) seasonal.push(next.label);
    }

    const always = ["customer spotlight", "behind the scenes", "product tip"];

    const combined = [...seasonal, ...always];
    const seen = new Set<string>();
    return combined.filter((idea) => {
      if (seen.has(idea)) return false;
      seen.add(idea);
      return true;
    }).slice(0, 4);
  }, []);

  useEffect(() => {
    imagePreviewRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
        setOpenSection(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const draft = searchParams.get("draft");
    const platform = searchParams.get("platform");
    if (draft) setCaption(draft);
    if (platform && platforms.some((p) => p.id === platform)) {
      setSelectedPlatforms([platform]);
    }
  }, [searchParams]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    );
  };

  const handleGeneratePosts = async () => {
    if (!caption.trim()) {
      setError("Add a post caption to get started");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform");
      return;
    }

    // Check if Facebook/Meta integration is connected for Facebook/Instagram
    const needsFacebook = selectedPlatforms.some((p) => p === "facebook" || p === "instagram");
    if (needsFacebook) {
      const facebookIntegration = integrations.find((i) => i.platform === "facebook");
      if (!facebookIntegration) {
        setError("Please connect your Facebook/Meta account in Settings to post to Facebook or Instagram");
        return;
      }

      const pages = facebookIntegration.metadata?.pages || [];
      if (pages.length === 0) {
        setError("No Facebook Pages found. Please connect a Facebook Page.");
        return;
      }

      // Check if Instagram is selected
      if (selectedPlatforms.includes("instagram")) {
        // Check if selected page (or default first page) has Instagram account
        const pageToCheck = pages.find((p: any) => p.id === selectedPageId) || pages[0];
        if (!pageToCheck || !pageToCheck.instagram_account) {
          setError("The selected Facebook Page does not have an Instagram Business account linked. Please link an Instagram Business account to your Facebook Page or select a different page.");
          return;
        }

        // If Instagram is selected but no images, show error
        if (imageFiles.length === 0) {
          setError("Instagram posts require at least one image");
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    setInfo(null);
    setPublishResults([]);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setInfo("Uploading images...");
        // Process for Instagram if Instagram is selected
        const processForInstagram = selectedPlatforms.includes("instagram");
        imageUrls = await uploadImages(imageFiles, processForInstagram);
      }

      // Publish posts
      setInfo("Publishing posts...");
      const response = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          platforms: selectedPlatforms,
          imageUrls,
          pageId: selectedPageId,
          linkedInOrganizationId: selectedLinkedInOrgId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish posts");
      }

      // Show results
      if (data.results) {
        setPublishResults(data.results);
        const successCount = data.results.filter((r: any) => r.success).length;
        const failCount = data.results.filter((r: any) => !r.success).length;

        if (successCount > 0 && failCount === 0) {
          setInfo(`Successfully published to ${successCount} platform${successCount > 1 ? "s" : ""}!`);
          // Clear form after successful publish
          setTimeout(() => {
            setCaption("");
            setImagePreviews([]);
            setImageFiles([]);
            setPublishResults([]);
            setInfo(null);
          }, 3000);
        } else if (successCount > 0 && failCount > 0) {
          setError(`Published to ${successCount} platform${successCount > 1 ? "s" : ""}, but ${failCount} failed. Check results below.`);
        } else {
          setError("Failed to publish to any platform. Check results below.");
        }
      } else {
        setInfo("Posts published successfully!");
        // Clear form after successful publish
        setTimeout(() => {
          setCaption("");
          setImagePreviews([]);
          setImageFiles([]);
          setInfo(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (postId: string) => {
    const post = generatedPosts.find((p) => p.id === postId);
    if (!post) return;

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/generate/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: caption,
          platforms: [post.platform],
          tone: post.tone,
          wordCount: wordLimit,
          generateHashtags: includeHashtags,
          includeEmojis,
          numPosts: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate post");
      }

      if (data.posts && data.posts.length > 0) {
        setGeneratedPosts((prev) => prev.map((p) => (p.id === postId ? data.posts[0] : p)));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editedCaption }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      setGeneratedPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, caption: editedCaption } : p)));
      setEditingPost(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveDraft = async () => {
    if (!caption.trim() || selectedPlatforms.length === 0) {
      setError("Add a caption and select platforms before saving");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setInfo("Uploading images...");
        // Process for Instagram if Instagram is selected
        const processForInstagram = selectedPlatforms.includes("instagram");
        imageUrls = await uploadImages(imageFiles, processForInstagram);
      }

      const response = await fetch("/api/posts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          platforms: selectedPlatforms,
          tone,
          includeHashtags,
          includeEmojis,
          imageUrls,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save draft");
      }

      setInfo("Draft saved successfully!");
      router.push(`/posts?new=${data.postIds.join(",")}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleDraft = () => {
    if (!caption.trim() || selectedPlatforms.length === 0) {
      setError("Add a caption and select platforms before scheduling");
      return;
    }
    setScheduleOpen(true);
    setError(null);
    setInfo(null);
    const today = new Date();
    setScheduleCalendarDate(today);
    const iso = today.toISOString().split("T")[0];
    setScheduleDate(iso);
    if (!scheduleTime) {
      setScheduleTime("09:00");
    }
  };

  const handleScheduleConfirm = async () => {
    if (!caption.trim()) {
      setError("Add a post caption to schedule");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform");
      return;
    }

    // Check if Facebook/Meta integration is connected
    const needsFacebook = selectedPlatforms.some((p) => p === "facebook" || p === "instagram");
    if (needsFacebook) {
      const facebookIntegration = integrations.find((i) => i.platform === "facebook");
      if (!facebookIntegration) {
        setError("Please connect your Facebook/Meta account in Settings to schedule posts");
        setScheduleOpen(false);
        return;
      }

      const pages = facebookIntegration.metadata?.pages || [];
      if (pages.length === 0) {
        setError("No Facebook Pages found. Please connect a Facebook Page.");
        setScheduleOpen(false);
        return;
      }

      // Check if Instagram is selected
      if (selectedPlatforms.includes("instagram")) {
        // Check if selected page (or default first page) has Instagram account
        const pageToCheck = pages.find((p: any) => p.id === selectedPageId) || pages[0];
        if (!pageToCheck || !pageToCheck.instagram_account) {
          setError("The selected Facebook Page does not have an Instagram Business account linked. Please link an Instagram Business account to your Facebook Page or select a different page.");
          setScheduleOpen(false);
          return;
        }

        // If Instagram is selected but no images, show error
        if (imageFiles.length === 0) {
          setError("Instagram posts require at least one image");
          setScheduleOpen(false);
          return;
        }
      }
    }

    if (!scheduleDate || !scheduleTime) {
      setError("Select a date and time to schedule");
      return;
    }

    setScheduleLoading(true);
    setError(null);
    setInfo(null);

    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduledDateTime < new Date()) {
        setError("Scheduled time must be in the future");
        setScheduleLoading(false);
        return;
      }

      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        // Process for Instagram if Instagram is selected
        const processForInstagram = selectedPlatforms.includes("instagram");
        imageUrls = await uploadImages(imageFiles, processForInstagram);
      }

      // Schedule posts
      const response = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          platforms: selectedPlatforms,
          imageUrls,
          pageId: selectedPageId,
          scheduledAt: scheduledDateTime.toISOString(),
          linkedInOrganizationId: selectedLinkedInOrgId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule posts");
      }

      setInfo(`Posts scheduled for ${scheduledDateTime.toLocaleString()}!`);
      setScheduleOpen(false);
      // Clear form after successful schedule
      setTimeout(() => {
        setCaption("");
        setImagePreviews([]);
        setImageFiles([]);
        setInfo(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxItems = 5;
    const availableSlots = maxItems - imagePreviews.length;
    if (availableSlots <= 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newFiles: File[] = [];
    const newUrls: string[] = [];
    Array.from(files)
      .slice(0, availableSlots)
      .forEach((file) => {
        newFiles.push(file);
        const url = URL.createObjectURL(file);
        newUrls.push(url);
      });

    if (newFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...newUrls]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearImagePreview = (index: number) => {
    const url = imagePreviews[index];
    URL.revokeObjectURL(url);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Load integrations on mount and when platforms change
  useEffect(() => {
    const loadIntegrations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id);

      if (data) {
        setIntegrations(data);
        // Set default page if Facebook integration exists
        const facebookIntegration = data.find((i) => i.platform === "facebook");
        if (facebookIntegration?.metadata?.pages?.[0]) {
          const firstPage = facebookIntegration.metadata.pages[0];
          // Only set if not already set or if current selection is invalid
          if (!selectedPageId || !facebookIntegration.metadata.pages.find((p: any) => p.id === selectedPageId)) {
            setSelectedPageId(firstPage.id);
          }
        }

        // LinkedIn only supports personal posting (no organizations without Community Management API)
        // So we'll always post as personal account (null = personal)
        setSelectedLinkedInOrgId(null);
      }
    };

    loadIntegrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, selectedPlatforms]);

  // Upload images to Supabase Storage
  const uploadImages = async (files: File[], processForInstagram: boolean = false): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        // If Instagram is selected, process images for Instagram requirements
        const shouldProcess = processForInstagram && selectedPlatforms.includes("instagram");
        const uploadUrl = shouldProcess
          ? `/api/posts/upload-image?processForInstagram=true&width=1080&quality=90`
          : `/api/posts/upload-image`;

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to upload image");
        }

        uploadedUrls.push(data.url);
      } catch (error: any) {
        console.error("Error uploading image:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    }

    return uploadedUrls;
  };

  const handleAiAction = async (action: AiAction) => {
    if (!caption.trim()) {
      setError("Add a caption to use AI actions");
      return;
    }

    setActionsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: caption,
          action: action.type,
          meta: action.meta,
          tone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI action failed");
      }

      if (action.type === "tone" && action.meta && tones.includes(action.meta as (typeof tones)[number])) {
        setTone(action.meta as (typeof tones)[number]);
      }

      setCaption(data.result || caption);
      setActionsOpen(false);
      setOpenSection(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionsLoading(false);
    }
  };

  const handleGenerateImage = () => {
    if (!caption.trim()) {
      setError("Add a caption before generating an image");
      return;
    }
    setError(null);
    setInfo("Generating an AI image...");
    setActionsOpen(false);
    setOpenSection(null);
  };

  const handleOptimizeForPlatforms = async () => {
    if (!caption.trim() || selectedPlatforms.length < 2) {
      setError("Add a caption and select multiple platforms to optimize");
      return;
    }

    setActionsLoading(true);
    setError(null);
    setInfo(null);

    try {
      // For now, optimize for the platform with the shortest word limit
      const shortestPlatform = selectedPlatforms.reduce((shortest, platform) => {
        const shortestLimit = platformWordLimits[shortest] ?? 150;
        const currentLimit = platformWordLimits[platform] ?? 150;
        return currentLimit < shortestLimit ? platform : shortest;
      }, selectedPlatforms[0]);

      const response = await fetch("/api/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: caption,
          action: "rewrite_x",
          meta: shortestPlatform,
          tone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to optimize caption");
      }

      setCaption(data.result || caption);
      setInfo(`Caption optimized for ${selectedPlatforms.length} platforms`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionsLoading(false);
    }
  };

  const getPlatformBadge = (platformId: string, size: number = 20) => {
    const platform = platforms.find((p) => p.id === platformId);
    if (!platform) return null;

    if (platform.logo) {
      return (
        <Image
          src={platform.logo}
          alt={platform.label}
          width={size}
          height={size}
          className="object-contain"
        />
      );
    }

    return <span className="text-xs uppercase">{platform.label[0]}</span>;
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="glass-base glass-high flex min-h-[calc(100vh-280px)] flex-col gap-6 rounded-3xl p-6 pb-6 shadow-lg shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {platforms.map((platform) => {
              const active = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                    active
                      ? "border-brand-400/60 bg-brand-500/20 text-white shadow-lg shadow-brand-500/20"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                  )}
                >
                  {getPlatformBadge(platform.id, 16)}
                  <span>{platform.label}</span>
                  {active && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0f172a] bg-brand-400 text-[#0f172a] shadow-sm">
                      <CloseIcon className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative" ref={actionsRef}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-gray-200 hover:border-white/20 hover:text-white"
              onClick={() => {
                const next = !actionsOpen;
                setActionsOpen(next);
                if (!next) {
                  setOpenSection(null);
                }
              }}
            >
              <Wand2 className="h-4 w-4" />
              AI Actions
            </Button>
            {actionsOpen && (
              <div
                className="absolute right-0 mt-2 min-w-[220px] rounded-2xl border border-white/10 bg-[#0f172a] p-3 shadow-2xl shadow-black/40"
                style={{ zIndex: 60 }}
              >
                <div className="flex flex-col gap-1">
                  {aiActionSections.map((section) => {
                    const isOpen = openSection === section.label;
                    return (
                      <div key={section.label} className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setOpenSection(isOpen ? null : section.label)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                            isOpen
                              ? "border-brand-400/60 bg-brand-500/20 text-white"
                              : "border-white/15 bg-white/10 text-gray-200 hover:border-white/30 hover:text-white"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {section.icon}
                            {section.label}
                          </span>
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                          <div className="space-y-1 mt-1 flex flex-col items-end">
                            {section.actions.map((action) => (
                              <button
                                key={action.id}
                                type="button"
                                onClick={() => {
                                  handleAiAction(action);
                                  setOpenSection(null);
                                }}
                                disabled={actionsLoading}
                                className={cn(
                                  "group flex w-[90%] items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition",
                                  actionsLoading
                                    ? "border-white/5 bg-white/5 text-gray-500 cursor-not-allowed"
                                    : "border-white/10 bg-white/10 text-gray-200 hover:border-brand-400/40 hover:text-white"
                                )}
                              >
                                {action.icon && (
                                  <span className="flex-shrink-0 text-gray-400 transition-colors group-hover:text-gray-200">{action.icon}</span>
                                )}
                                <span className="flex-1">{action.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-200">Post Draft</h4>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-brand-300 hover:text-brand-200"
              onClick={() => router.push("/copilot")}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Open Copilot
            </Button>
          </div>
          <div className="relative mt-3 flex min-h-0 flex-1 flex-col">
            {/* Page/Account Selection */}
            {integrations.some((i) => i.platform === "facebook") && 
             selectedPlatforms.some((p) => p === "facebook" || p === "instagram") && (
              <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-medium text-gray-400">Posting to:</p>
                {(() => {
                  const facebookIntegration = integrations.find((i) => i.platform === "facebook");
                  const pages = facebookIntegration?.metadata?.pages || [];
                  const selectedPage = pages.find((p: any) => p.id === selectedPageId) || pages[0];
                  
                  if (!selectedPage) {
                    return (
                      <p className="text-xs text-red-400">No Facebook Page available</p>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <span className="font-medium">{selectedPage.name}</span>
                        {selectedPage.instagram_account && (
                          <span className="text-xs text-gray-400">
                            · @{selectedPage.instagram_account.username}
                          </span>
                        )}
                      </div>
                      {pages.length > 1 && (
                        <select
                          value={selectedPageId || ""}
                          onChange={(e) => setSelectedPageId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {pages.map((page: any) => (
                            <option key={page.id} value={page.id}>
                              {page.name}
                              {page.instagram_account ? ` (@${page.instagram_account.username})` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* LinkedIn Account Selection */}
            {integrations.some((i) => i.platform === "linkedin") && 
             selectedPlatforms.includes("linkedin") && (
              <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-medium text-gray-400">Posting to:</p>
                {(() => {
                  const linkedInIntegration = integrations.find((i) => i.platform === "linkedin");
                  const profile = (linkedInIntegration?.metadata as any)?.profile;

                  if (!profile) {
                    return (
                      <p className="text-xs text-red-400">No LinkedIn profile available</p>
                    );
                  }

                  const profileName = profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || "Personal";

                  return (
                    <div className="flex items-center gap-2 text-sm text-gray-200">
                      <span className="font-medium">{profileName}</span>
                      <span className="text-xs text-gray-400">(Personal)</span>
                    </div>
                  );
                })()}
              </div>
            )}


            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Share your idea, audience, and goal..."
              className={cn(
                "min-h-0 flex-1 w-full rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 pr-28 text-sm text-gray-100 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none",
                caption.trim().length === 0 && upcomingIdeas.length > 0 && "pt-14"
              )}
            />

            {caption.trim().length === 0 && upcomingIdeas.length > 0 && (
              <div className="pointer-events-auto absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                {upcomingIdeas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-300 hover:border-white/30 hover:text-white"
                    onClick={() => {
                      setCaption(idea.charAt(0).toUpperCase() + idea.slice(1));
                    }}
                  >
                    {idea}
                  </button>
                ))}
              </div>
            )}

            <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={handleImageUploadClick}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200 hover:border-white/30 hover:text-white"
              >
                <Upload className="h-4 w-4" /> Upload media
              </button>
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={!caption.trim()}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
                  caption.trim()
                    ? "border-emerald-500/50 bg-emerald-400/20 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100"
                    : "border-white/10 bg-white/5 text-gray-500 cursor-not-allowed"
                )}
              >
                <Sparkles className="h-4 w-4" /> Generate AI Image
              </button>
              {selectedPlatforms.length > 1 && caption.trim() && (
                <button
                  type="button"
                  onClick={handleOptimizeForPlatforms}
                  disabled={actionsLoading || !caption.trim()}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
                    actionsLoading
                      ? "border-white/10 bg-white/5 text-gray-500 cursor-not-allowed"
                      : "border-brand-400/50 bg-brand-500/20 text-brand-200 hover:border-brand-400 hover:bg-brand-500/30 hover:text-brand-100"
                  )}
                >
                  {actionsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Optimize for {selectedPlatforms.length} platforms
                </button>
              )}
            </div>

            <span className="pointer-events-none absolute bottom-3 right-4 z-20 text-xs text-gray-400">
              {wordCount}/{wordLimit}
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleImageSelected}
            />

            {imagePreviews.length > 0 && (
              <div className="absolute bottom-16 left-4 z-20 flex max-w-[80%] flex-wrap gap-2">
                {imagePreviews.map((url, index) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200"
                  >
                    <Image src={url} alt="Selected" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                    <button type="button" onClick={() => clearImagePreview(index)} className="text-gray-400 hover:text-white">
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-3 text-sm text-emerald-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {publishResults.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-200">Publish Results:</p>
            {publishResults.map((result) => (
              <div
                key={result.platform}
                className={`flex items-center justify-between rounded-lg p-2 ${
                  result.success
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium capitalize text-gray-200">{result.platform}</span>
                </div>
                <span className={`text-xs ${result.success ? "text-emerald-400" : "text-red-400"}`}>
                  {result.success ? "Published" : result.error || "Failed"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-0">
          <Button
            onClick={handleGeneratePosts}
            disabled={loading}
            className="inline-flex flex-1 min-w-[200px] items-center justify-center gap-2 rounded-full bg-gradient-brand py-3 text-base font-semibold text-white shadow-brand hover:bg-gradient-brand-hover"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? "Posting" : "Post Now"}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={loading}
            className="rounded-full border-white/20 bg-white/5 text-gray-100 hover:border-white/40"
          >
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button
            variant="outline"
            onClick={handleScheduleDraft}
            disabled={loading}
            className="rounded-full border-white/20 bg-white/5 text-gray-100 hover:border-white/40"
          >
            <Calendar className="mr-2 h-4 w-4" /> Schedule Post
          </Button>
        </div>
      </div>

      <aside className="flex flex-col xl:self-start">
        <PostPreviewPanel
          selectedPlatforms={selectedPlatforms as ("instagram" | "facebook" | "linkedin")[]}
          caption={caption}
          hashtags={caption.match(/#[\p{L}0-9_]+/gu) ?? []}
          imageUrls={imagePreviews}
          tone={tone}
          includeHashtags={includeHashtags}
        />
      </aside>

      {scheduleOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/70 p-6">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl shadow-black/50">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Schedule Post</p>
                <p className="text-xs text-gray-400">Choose a slot before confirming</p>
              </div>
              <button onClick={() => setScheduleOpen(false)} className="rounded-full bg-white/5 p-1 text-gray-400 hover:text-white">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_260px]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <ShadcnCalendar
                  selected={scheduleCalendarDate}
                  onSelect={(date) => {
                    setScheduleCalendarDate(date ?? undefined);
                    if (date) {
                      setScheduleDate(date.toISOString().split("T")[0]);
                    } else {
                      setScheduleDate("");
                    }
                  }}
                  className="rounded-2xl border border-white/10 bg-[#0f172a] text-gray-100"
                  captionLayout="dropdown"
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Pick a time</p>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(event) => setScheduleTime(event.target.value)}
                    className="mt-3 rounded-2xl border-white/10 bg-[#0f172a] text-gray-100"
                  />
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Platforms</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-100">
                    {selectedPlatforms.map((platform) => {
                      const token = platforms.find((item) => item.id === platform);
                      return (
                        <span
                          key={platform}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 capitalize"
                        >
                          {token?.logo ? (
                            <Image src={token.logo} alt={token.label} width={16} height={16} className="h-4 w-4 object-contain" />
                          ) : null}
                          {token?.label ?? platform}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setScheduleOpen(false)} className="text-gray-300 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleScheduleConfirm}
                disabled={scheduleLoading}
                className="bg-gradient-brand hover:bg-gradient-brand-hover"
              >
                {scheduleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                <span className="ml-2">Confirm Schedule</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

