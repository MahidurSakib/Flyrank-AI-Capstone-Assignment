"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { ArrowDown, History, Send, Square, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { getSettings, getSession, upsertSession, type StoredMessage } from "@/lib/storage";

// How close to the bottom (in px) counts as "still at the bottom" for the
// purpose of auto-scroll. A small tolerance avoids fighting sub-pixel
// rounding from the browser.
const BOTTOM_THRESHOLD_PX = 48;

function ChatPageContent() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("session");

  const [sessionId] = useState(() => resumeId ?? crypto.randomUUID());
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // Read settings fresh on every request rather than from a closed-
        // over React value, so a preference changed on the Settings page
        // takes effect on the very next message without needing a remount.
        body: () => ({ responseStyle: getSettings().responseStyle }),
      })
  );

  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({
    id: sessionId,
    transport,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const clearModalTitleId = useId();
  const hasLoadedResumeRef = useRef(false);

  // Load a saved conversation when arriving via /chat?session=<id> from
  // the History page. Runs once; loading via setMessages rather than an
  // initial-messages constructor option, since that option has known
  // reliability issues across AI SDK versions.
  useEffect(() => {
    if (resumeId && !hasLoadedResumeRef.current) {
      const saved = getSession(resumeId);
      if (saved) {
        setMessages(
          saved.messages.map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text" as const, text: m.text }],
          }))
        );
      }
      hasLoadedResumeRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  // Persist to localStorage on every message change, so the History page
  // stays current and a conversation survives navigating away and back.
  useEffect(() => {
    if (messages.length === 0) return;
    const stored: StoredMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role === "user" ? "user" : "assistant",
      text: m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join(""),
    }));
    upsertSession(sessionId, stored);
  }, [messages, sessionId]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom <= BOTTOM_THRESHOLD_PX);
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setIsPinnedToBottom(true);
  }

  useEffect(() => {
    if (isPinnedToBottom) {
      scrollToBottom("auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input });
    setInput("");
    setIsPinnedToBottom(true);
  }

  function handleConfirmClear() {
    setMessages([]);
    setIsClearModalOpen(false);
  }

  return (
    <div className="flex flex-col h-[75vh] max-h-[700px]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--muted)" }}
          >
            <History size={15} aria-hidden="true" />
            History
          </Link>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-1.5 text-sm hover:text-red-600 dark:hover:text-red-400 transition-colors"
              style={{ color: "var(--muted)" }}
            >
              <Trash2 size={15} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto rounded-lg border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {messages.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Ask a study question to get started — summarize notes,
              generate quiz questions, or work through a concept together.
            </p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] sm:max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                message.role === "user" ? "ml-auto text-white" : "mr-auto"
              }`}
              style={
                message.role === "user"
                  ? { background: "var(--accent)" }
                  : { background: "color-mix(in srgb, var(--border) 40%, transparent)" }
              }
            >
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  <span key={`${message.id}-${i}`}>{part.text}</span>
                ) : null
              )}
            </div>
          ))}

          {status === "submitted" && (
            <div
              className="mr-auto max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm flex gap-1"
              style={{ background: "color-mix(in srgb, var(--border) 40%, transparent)" }}
              aria-live="polite"
              aria-label="Assistant is thinking"
            >
              <span className="animate-bounce [animation-delay:-0.3s]">•</span>
              <span className="animate-bounce [animation-delay:-0.15s]">•</span>
              <span className="animate-bounce">•</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mr-auto max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900"
            >
              <p className="mb-2">
                {error.message || "Something went wrong. Please try again."}
              </p>
              <button
                type="button"
                onClick={() => regenerate()}
                className="text-sm font-medium underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {!isPinnedToBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            aria-label="Jump to latest message"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full text-white text-xs px-3 py-1.5 shadow-md"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            <ArrowDown size={12} aria-hidden="true" />
            Jump to latest
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a study question..."
          disabled={isBusy}
          aria-label="Study question"
          className="flex-1 min-w-0 border rounded-full px-4 py-2.5 text-sm bg-transparent disabled:opacity-60"
          style={{ borderColor: "var(--border)" }}
        />
        {isBusy ? (
          <button
            type="button"
            onClick={() => stop()}
            aria-label="Stop generating"
            className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Square size={16} fill="currentColor" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send message"
            className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-white disabled:opacity-40 transition-opacity"
            style={{ background: "var(--accent)" }}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        )}
      </form>

      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        titleId={clearModalTitleId}
        title="Clear this conversation?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
              style={{ borderColor: "var(--border)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClear}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Clear
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          This removes every message in the current session. It can&apos;t be
          undone.
        </p>
      </Modal>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-[75vh]" />}>
      <ChatPageContent />
    </Suspense>
  );
}
