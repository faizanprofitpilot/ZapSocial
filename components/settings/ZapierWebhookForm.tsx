"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ZapierWebhookForm({ initialUrl }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to save webhook");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Failed to save webhook URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="webhook_url" className="text-sm font-medium text-gray-50">
          Zapier Webhook URL
        </label>
        <Input
          id="webhook_url"
          type="url"
          placeholder="https://hooks.zapier.com/hooks/catch/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <p className="text-sm text-gray-400">
          Get your webhook URL from your Zapier Zap configuration
        </p>
      </div>
      <Button type="submit" disabled={loading || success}>
        {loading ? "Saving..." : success ? "✅ Saved!" : "Save Webhook"}
      </Button>
    </form>
  );
}

