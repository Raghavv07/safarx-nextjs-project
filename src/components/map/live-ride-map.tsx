"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";
import type { LiveMapInnerProps } from "./live-map-inner";

const LiveMapInner = dynamic(() => import("./live-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center animate-ping" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
        <span>Loading SafarX Live Map Engine...</span>
      </div>
    </div>
  ),
});

export function LiveRideMap(props: LiveMapInnerProps) {
  return <LiveMapInner {...props} />;
}
