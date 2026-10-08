"use client";

import * as React from "react";
import {
  getChatMessagesAction,
  sendChatMessageAction,
  type ChatMessageItem,
} from "@/actions/chat";
import { createClient } from "@/lib/supabase/client";
import { AiSuggestionChips } from "./ai-suggestion-chips";
import { playChimeTone } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Car,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface InRideChatDrawerProps {
  bookingId: string;
  currentUserRole: "rider" | "driver";
  counterpartName?: string;
  className?: string;
}

export function InRideChatDrawer({
  bookingId,
  currentUserRole,
  counterpartName = "Driver Partner",
  className = "",
}: InRideChatDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [lastCounterpartMessage, setLastCounterpartMessage] = React.useState<string>("");

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const senderRole = currentUserRole === "driver" ? "driver" : "user";
  const counterpartRole = currentUserRole === "driver" ? "user" : "driver";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Initial messages fetch
  React.useEffect(() => {
    if (!bookingId) return;
    let isMounted = true;

    getChatMessagesAction(bookingId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.messages) {
          setMessages(res.messages);

          // Find last counterpart message for AI suggestion trigger
          const counterpartMsgs = res.messages.filter(
            (m) => m.sender === counterpartRole
          );
          if (counterpartMsgs.length > 0) {
            setLastCounterpartMessage(
              counterpartMsgs[counterpartMsgs.length - 1].text
            );
          }
        }
      })
      .catch((err) => {
        console.error("[InRideChatDrawer] Fetch error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, counterpartRole]);

  // 2. Realtime Subscription & Polling Fallback
  React.useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    const supabase = createClient();
    const channelName = `ride-${bookingId}`;
    const channel = supabase.channel(channelName);

    channel
      // Listen to PostgreSQL changes on the ChatMessage table
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessage",
          filter: `bookingId=eq.${bookingId}`,
        },
        (payload: { new: { id: string; sender: "user" | "driver"; text: string; createdAt: string } }) => {
          if (!isMounted) return;
          const newMsg: ChatMessageItem = {
            id: payload.new.id,
            bookingId,
            sender: payload.new.sender,
            text: payload.new.text,
            createdAt: payload.new.createdAt,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If message is from counterpart, play ping and update suggestions
          if (newMsg.sender === counterpartRole) {
            playChimeTone(784, 1046.5, 0.15);
            setLastCounterpartMessage(newMsg.text);
            if (!isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      // Listen to Realtime Broadcast chat events
      .on(
        "broadcast",
        { event: "chat-message" },
        (payload: { payload: ChatMessageItem }) => {
          if (!isMounted) return;
          const incoming = payload.payload;
          if (!incoming || !incoming.id) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });

          if (incoming.sender === counterpartRole) {
            playChimeTone(784, 1046.5, 0.15);
            setLastCounterpartMessage(incoming.text);
            if (!isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .subscribe();

    // 3s polling heartbeat for fail-safe message sync
    const interval = setInterval(() => {
      getChatMessagesAction(bookingId)
        .then((res) => {
          if (!isMounted || !res.success || !res.messages) return;
          setMessages(res.messages);
        })
        .catch(() => {});
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [bookingId, counterpartRole, isOpen]);

  // Scroll to bottom when messages update
  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Reset unread count when drawer opens
  const handleOpenDrawer = () => {
    setIsOpen(true);
    setUnreadCount(0);
    scrollToBottom();
  };

  // 3. Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      const res = await sendChatMessageAction(bookingId, text, senderRole);
      if (res.success && res.message) {
        const sent = res.message;

        // Append to local state immediately
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });

        // Broadcast to Supabase Realtime channel
        const supabase = createClient();
        await supabase.channel(`ride-${bookingId}`).send({
          type: "broadcast",
          event: "chat-message",
          payload: sent,
        });

        scrollToBottom();
      } else {
        alert(res.error || "Failed to send message");
      }
    } catch (err) {
      console.error("[InRideChatDrawer] Send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-send when clicking AI quick reply suggestion
  const handleSelectAiSuggestion = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleOpenDrawer}
            className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3.5 text-white shadow-2xl shadow-purple-600/40 transition-shadow hover:shadow-purple-600/60"
            title="Open in-ride chat"
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-white animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold tracking-wide hidden sm:inline">
              Chat with {currentUserRole === "driver" ? "Passenger" : "Driver"}
            </span>
          </motion.button>
        </div>
      )}

      {/* Slide-Over In-Ride Chat Drawer with AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[580px] z-50 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl sm:rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center font-bold text-white">
                  {currentUserRole === "driver" ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Car className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold">{counterpartName}</h4>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] text-purple-100/90 capitalize block">
                    {currentUserRole === "driver" ? "Passenger Chat" : "Driver Chat"} · Live Sync
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Messages Scroll View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50 dark:bg-zinc-950/60">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-400">
                  <Bot className="h-8 w-8 text-purple-400" />
                  <p className="text-xs font-medium">No messages yet.</p>
                  <p className="text-[11px] text-zinc-500">
                    Send a quick message or use DeepSeek AI suggestions below for instant coordination.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === senderRole;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                          isMe
                            ? "bg-purple-600 text-white rounded-br-xs"
                            : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-zinc-400 mt-1 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* DeepSeek AI Quick Replies Panel */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 pt-2">
              <AiSuggestionChips
                lastMessage={
                  lastCounterpartMessage ||
                  (currentUserRole === "driver" ? "Rider is waiting" : "Driver is approaching")
                }
                role={currentUserRole}
                onSelectSuggestion={handleSelectAiSuggestion}
              />
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
              <Button
                type="submit"
                disabled={isSending || !inputText.trim()}
                size="sm"
                className="h-9 w-9 p-0 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shrink-0"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
