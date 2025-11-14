"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PublishButton({ contentId }: { contentId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/zapier/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Failed to publish to Zapier. Please check your webhook configuration in settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={loading || success}
      variant={success ? "default" : "outline"}
    >
      {loading ? "Publishing..." : success ? "✅ Sent to Zapier!" : "Publish to Zapier"}
    </Button>
  );
}

