"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function FloatingCreateButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    // Navigate to AI Composer
    router.push("/dashboard/create");
  };

  return (
    <Button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 md:right-6 z-50 bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 shadow-lg rounded-full h-14 w-14 p-0 transition-all duration-300 hover:scale-110"
      title="Create New Post"
    >
      <Plus className={`w-6 h-6 transition-transform duration-300 ${isHovered ? "rotate-90" : ""}`} />
    </Button>
  );
}

