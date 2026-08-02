"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { deleteSession, listSessions, type ChatSessionRecord } from "@/lib/storage";
import { Modal } from "@/components/Modal";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ChatSessionRecord[] | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const modalTitleId = useId();

  useEffect(() => {
    setSessions(listSessions());
  }, []);

  function handleConfirmDelete() {
    if (pendingDeleteId) {
      deleteSession(pendingDeleteId);
      setSessions(listSessions());
      setPendingDeleteId(null);
    }
  }

  if (sessions === null) {
    return <p className="text-sm" style={{ color: "var(--muted)" }}>Loading history…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Past conversations, saved to this browser.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div
          className="rounded-lg border border-dashed px-6 py-10 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <MessageSquare size={28} className="mx-auto mb-3" style={{ color: "var(--muted)" }} aria-hidden="true" />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No conversations yet.
          </p>
          <Link
            href="/chat"
            className="inline-block mt-3 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Start your first chat →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <Link href={`/chat?session=${session.id}`} className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{session.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {session.messages.length} messages · {formatRelativeTime(session.updatedAt)}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => setPendingDeleteId(session.id)}
                aria-label={`Delete conversation: ${session.title}`}
                className="shrink-0 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-colors"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        titleId={modalTitleId}
        title="Delete this conversation?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPendingDeleteId(null)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
              style={{ borderColor: "var(--border)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}
