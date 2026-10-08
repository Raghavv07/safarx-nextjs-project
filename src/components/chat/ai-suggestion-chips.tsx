"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { motion } from "motion/react";

export interface AiSuggestionChipsProps {
  lastMessage?: string;
  role?: "rider" | "driver" | "user" | "partner";
  onSelectSuggestion: (text: string) => void;
  className?: string;
}

export function AiSuggestionChips({
  lastMessage,
  role = "rider",
  onSelectSuggestion,
  className = "",
}: AiSuggestionChipsProps) {
  const trimmedMessage = lastMessage?.trim() || "";

  // TanStack Query integration for caching & asynchronous fetching
  const { data: suggestions = [], isLoading } = useQuery<string[]>({
    queryKey: ["ai-suggestions", trimmedMessage, role],
    queryFn: async () => {
      if (!trimmedMessage) return [];
      const res = await fetch("/api/chat/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastMessage: trimmedMessage, role }),
      });
      const data = await res.json();
      return data.success && Array.isArray(data.suggestions)
        ? data.suggestions
        : [];
    },
    enabled: trimmedMessage.length > 0,
    staleTime: 60 * 1000, // cache for 1 minute
  });

  if (!trimmedMessage && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 py-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
        <span className="font-medium text-[11px]">DeepSeek Quick Replies</span>
        {isLoading && (
          <Loader2 className="h-2.5 w-2.5 animate-spin ml-1 text-purple-500" />
        )}
        <Badge
          variant="outline"
          className="ml-auto text-[9px] px-1.5 py-0 font-normal border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400"
        >
          APInex AI
        </Badge>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            initial={{ opacity: 0, scale: 0.85, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => onSelectSuggestion(suggestion)}
            className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-zinc-200 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
