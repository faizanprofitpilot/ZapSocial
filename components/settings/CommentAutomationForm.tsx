"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";

interface UserSettings {
  comment_auto_reply_enabled: boolean;
  comment_reply_window_minutes: number;
  comment_reply_tone: "friendly" | "professional" | "playful" | "witty";
  comment_exclude_keywords: string[];
  comment_max_replies_per_post_per_day: number;
}

export function CommentAutomationForm() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    comment_auto_reply_enabled: false,
    comment_reply_window_minutes: 60,
    comment_reply_tone: "friendly",
    comment_exclude_keywords: [],
    comment_max_replies_per_post_per_day: 10,
  });
  const [excludeKeywordsInput, setExcludeKeywordsInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = not found, which is fine for new users
          console.error("Error loading settings:", error);
        }

        if (data) {
          setSettings({
            comment_auto_reply_enabled: data.comment_auto_reply_enabled || false,
            comment_reply_window_minutes: data.comment_reply_window_minutes || 60,
            comment_reply_tone: data.comment_reply_tone || "friendly",
            comment_exclude_keywords: data.comment_exclude_keywords || [],
            comment_max_replies_per_post_per_day: data.comment_max_replies_per_post_per_day || 10,
          });
          setExcludeKeywordsInput((data.comment_exclude_keywords || []).join(", "));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [supabase]);

  const handleSave = async () => {
    if (!supabase) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const keywords = excludeKeywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const settingsToSave = {
        ...settings,
        comment_exclude_keywords: keywords,
      };

      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          ...settingsToSave,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      alert("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-base glass-mid border border-white/10">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white">Comment Reply Automation</CardTitle>
        <CardDescription className="text-gray-400">
          Automatically reply to comments on your social media posts using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-white font-medium">
              Enable Auto-Replies
            </Label>
            <p className="text-sm text-gray-400">
              Automatically generate and post replies to new comments
            </p>
          </div>
          <Switch
            id="enabled"
            checked={settings.comment_auto_reply_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, comment_auto_reply_enabled: checked })
            }
          />
        </div>

        {/* Reply Window */}
        <div className="space-y-2">
          <Label htmlFor="window" className="text-white font-medium">
            Reply Window (minutes)
          </Label>
          <p className="text-sm text-gray-400">
            Only reply to comments posted within this time window
          </p>
          <Input
            id="window"
            type="number"
            min="1"
            max="1440"
            value={settings.comment_reply_window_minutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                comment_reply_window_minutes: parseInt(e.target.value) || 60,
              })
            }
            className="bg-white/5 border-white/10 text-white"
            disabled={!settings.comment_auto_reply_enabled}
          />
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="text-white font-medium">
            Reply Tone
          </Label>
          <p className="text-sm text-gray-400">The personality of AI-generated replies</p>
          <select
            id="tone"
            value={settings.comment_reply_tone}
            onChange={(e) =>
              setSettings({
                ...settings,
                comment_reply_tone: e.target.value as UserSettings["comment_reply_tone"],
              })
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            disabled={!settings.comment_auto_reply_enabled}
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="playful">Playful</option>
            <option value="witty">Witty</option>
          </select>
        </div>

        {/* Exclude Keywords */}
        <div className="space-y-2">
          <Label htmlFor="exclude" className="text-white font-medium">
            Exclude Keywords
          </Label>
          <p className="text-sm text-gray-400">
            Comma-separated list of keywords. Comments containing these will be ignored.
          </p>
          <Input
            id="exclude"
            type="text"
            placeholder="spam, promotion, advertising"
            value={excludeKeywordsInput}
            onChange={(e) => setExcludeKeywordsInput(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            disabled={!settings.comment_auto_reply_enabled}
          />
        </div>

        {/* Max Replies Per Post */}
        <div className="space-y-2">
          <Label htmlFor="maxReplies" className="text-white font-medium">
            Max Replies Per Post Per Day
          </Label>
          <p className="text-sm text-gray-400">
            Limit automatic replies to prevent over-engagement
          </p>
          <Input
            id="maxReplies"
            type="number"
            min="1"
            max="100"
            value={settings.comment_max_replies_per_post_per_day}
            onChange={(e) =>
              setSettings({
                ...settings,
                comment_max_replies_per_post_per_day: parseInt(e.target.value) || 10,
              })
            }
            className="bg-white/5 border-white/10 text-white"
            disabled={!settings.comment_auto_reply_enabled}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-black font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

