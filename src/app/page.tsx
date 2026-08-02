import Link from "next/link";
import { MessageCircle, Activity } from "lucide-react";
import { Disclosure } from "@/components/Disclosure";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Welcome to your AI Study Assistant
        </h1>
        <p className="max-w-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
          Summarize notes, generate quiz questions, and review your study
          history — all in one place. This app is in active development;
          more features are on the way.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            <MessageCircle size={16} aria-hidden="true" />
            Start a chat
          </Link>
          <Link
            href="/health"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            <Activity size={16} aria-hidden="true" />
            Check system health
          </Link>
        </div>
      </div>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-semibold mb-3">
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          <Disclosure summary="What can I actually ask the assistant?">
            <p>
              Anything study-related: paste in notes and ask for a summary,
              ask it to generate quiz questions on a topic, or work through
              a concept you&apos;re stuck on. It keeps track of the whole
              conversation, so follow-up questions have full context.
            </p>
          </Disclosure>
          <Disclosure summary="Is my conversation saved anywhere?">
            <p>
              Yes — every conversation is saved to this browser and shows
              up on the History page, where you can reopen or delete it.
              It doesn&apos;t sync across devices yet (see the README&apos;s
              known limitations).
            </p>
          </Disclosure>
          <Disclosure summary="What happens if the AI service is down or slow?">
            <p>
              The chat page shows a clear error message with a Retry button
              rather than failing silently — you&apos;ll never be left
              staring at a stuck &quot;thinking&quot; indicator with no
              explanation.
            </p>
          </Disclosure>
          <Disclosure summary="Can I change how the assistant responds?">
            <p>
              Yes — the Settings page lets you switch between concise and
              detailed response styles, and it actually changes the
              instructions sent to the model, not just a label.
            </p>
          </Disclosure>
        </div>
      </section>
    </div>
  );
}
