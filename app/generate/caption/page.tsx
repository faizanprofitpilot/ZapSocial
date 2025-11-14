"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function CaptionGeneratorPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate captions");
      }

      router.push(`/content/${data.content.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-50">Social Media Caption Generator</h1>
            <p className="text-gray-300 mt-1">Generate engaging captions for Twitter, LinkedIn, and Instagram</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Step 1: Input Your Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="input" className="text-sm font-medium text-gray-50">
                  Enter a sentence, blog link, or keyword
                </label>
                <Input
                  id="input"
                  placeholder="e.g., 'Check out our new AI features'"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              {error && (
                <div className="p-4 text-sm text-red-400 bg-red-900/30 rounded-lg border border-red-500/30">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-brand hover:bg-gradient-brand-hover" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⚡</span>
                    Generating...
                  </span>
                ) : (
                  "Generate Captions"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
