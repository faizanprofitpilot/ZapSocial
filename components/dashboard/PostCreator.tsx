"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const platforms = [
  { id: "instagram", label: "Instagram", logo: "/Instagram logo.png", color: "from-cyan-400 to-cyan-600" },
  { id: "linkedin", label: "LinkedIn", logo: "/Linkedin logo.png", color: "from-blue-500 to-blue-600" },
  { id: "facebook", label: "Facebook", logo: "/Facebook logo.png", color: "from-blue-600 to-blue-700" },
];

type PostCreatorProps = {
  onGenerate: (topic: string, platforms: string[], generateImage: boolean) => Promise<void>;
  initialTopic?: string;
  initialPlatform?: string;
};

export function PostCreator({ onGenerate, initialTopic, initialPlatform }: PostCreatorProps) {
  const [topic, setTopic] = useState(initialTopic || "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialPlatform ? [initialPlatform] : []);
  const [generateImage, setGenerateImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || selectedPlatforms.length === 0) {
      setError("Please enter a topic and select at least one platform");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onGenerate(topic, selectedPlatforms, generateImage);
      // Reset form after successful generation
      setTopic("");
      setSelectedPlatforms([]);
      setGenerateImage(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-light border border-white/10">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-50">Create Post</CardTitle>
        <CardDescription className="text-gray-300">
          Generate AI-powered social media content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium text-gray-50">
              Topic or Idea
            </label>
            <Input
              id="topic"
              placeholder="e.g., 'Announcing our new product launch'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-50">Select Platforms</label>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-xs
                      ${isSelected
                        ? `border-white/30 bg-gradient-to-br ${platform.color} opacity-90`
                        : "border-white/10 glass-light hover:border-white/20"
                      }
                    `}
                  >
                    {platform.logo ? (
                      <Image
                        src={platform.logo}
                        alt={platform.label}
                        width={24}
                        height={24}
                        className="object-contain mx-auto mb-1"
                      />
                    ) : null}
                    <span className={`text-xs font-medium block ${isSelected ? "text-white" : "text-gray-300"}`}>
                      {platform.label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="generateImage"
              checked={generateImage}
              onChange={(e) => setGenerateImage(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-brand-500"
            />
            <label htmlFor="generateImage" className="text-sm text-gray-300">
              Generate AI image
            </label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/30 rounded-lg border border-red-500/30">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-cyan-400 to-cyan-600 hover:bg-gradient-to-r from-cyan-400 to-cyan-600-hover"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Posts"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

