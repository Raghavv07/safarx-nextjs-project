"use client";

import * as React from "react";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
  CallControls,
  type Call,
  type User as StreamUser,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Video, ShieldCheck, PhoneOff, Loader2, Sparkles } from "lucide-react";
import { startVideoKycSessionAction } from "@/actions/stream";

export interface VideoKycRoomProps {
  partnerId?: string;
  partnerName?: string;
}

export function VideoKycRoom({
  partnerId,
  partnerName = "Partner Candidate",
}: VideoKycRoomProps) {
  const [client, setClient] = React.useState<StreamVideoClient | null>(null);
  const [call, setCall] = React.useState<Call | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const startCall = async () => {
    setIsInitializing(true);
    setErrorMsg(null);

    try {
      const res = await startVideoKycSessionAction(partnerId);

      if (!res.success || !res.callId || !res.token || !res.apiKey || !res.userId) {
        throw new Error(res.error || "Failed to start Video KYC call session");
      }

      const streamUser: StreamUser = {
        id: res.userId,
        name: res.userName || partnerName,
      };

      // 1. Initialize StreamVideoClient
      const videoClient = new StreamVideoClient({
        apiKey: res.apiKey,
        user: streamUser,
        token: res.token,
      });

      // 2. Initialize and join call
      const videoCall = videoClient.call("default", res.callId);
      await videoCall.join({ create: true });

      setClient(videoClient);
      setCall(videoCall);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join video call";
      setErrorMsg(message);
    } finally {
      setIsInitializing(false);
    }
  };

  const endCall = async () => {
    if (call) {
      await call.leave();
      setCall(null);
    }
    if (client) {
      await client.disconnectUser();
      setClient(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (call) call.leave();
      if (client) client.disconnectUser();
    };
  }, [call, client]);

  // If in active call, render Stream Video UI
  if (client && call) {
    return (
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <div className="flex flex-col h-[650px] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl relative">
            {/* Header overlay */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700/60 pointer-events-auto">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-white">Live Video KYC</span>
                <Badge variant="outline" className="text-[10px] text-zinc-300 border-zinc-600">
                  Mumbai Region
                </Badge>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={endCall}
                className="pointer-events-auto gap-1.5 shadow-lg"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Session</span>
              </Button>
            </div>

            {/* Video Stream Layout */}
            <div className="flex-1 w-full bg-zinc-950 flex items-center justify-center p-4">
              <SpeakerLayout />
            </div>

            {/* Call Controls Bar */}
            <div className="bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 py-3 flex justify-center z-10">
              <CallControls onLeave={endCall} />
            </div>
          </div>
        </StreamCall>
      </StreamVideo>
    );
  }

  // Pre-call launch card
  return (
    <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Driver Video KYC Portal</CardTitle>
              <CardDescription>
                Live face-to-face verification powered by GetStream Video SDK
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400">
            GetStream React SDK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Verification Guidelines:</span>
          </div>
          <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
            <li>Ensure a well-lit room with your camera and microphone enabled.</li>
            <li>Keep your original Aadhaar Card and Driving License handy.</li>
            <li>Verification takes under 2 minutes with SafarX compliance team.</li>
          </ul>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        <Button
          onClick={startCall}
          disabled={isInitializing}
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isInitializing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to GetStream Gateway...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Launch Live Video KYC Session</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
