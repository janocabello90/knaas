"use client";

import { useEffect, useState, useRef } from "react";
import {
  Loader2,
  Pin,
  MessageSquare,
  Send,
  ArrowLeft,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  body: string;
  category: string | null;
  pinned: boolean;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  author_first_name: string;
  author_last_name: string;
  author_photo: string | null;
  author_role: string;
}

interface Reply {
  id: string;
  topic_id: string;
  body: string;
  created_at: string;
  author_first_name: string;
  author_last_name: string;
  author_photo: string | null;
  author_role: string;
}

function Avatar({ name, photo, role }: { name: string; photo: string | null; role?: string }) {
  const isAdmin = role === "SUPERADMIN";
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`h-8 w-8 rounded-full object-cover flex-shrink-0 ${isAdmin ? "ring-2 ring-blue-400" : ""}`}
      />
    );
  }
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
      isAdmin ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400" : "bg-gray-100 text-gray-500"
    }`}>
      {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function FeedPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const repliesEndRef = useRef<HTMLDivElement>(null);

  // Load topics
  async function loadTopics() {
    try {
      const res = await fetch("/api/alumno/feed");
      if (!res.ok) throw new Error("Error cargando feed");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTopics(); }, []);

  // Open thread
  async function openThread(topic: Topic) {
    setActiveTopic(topic);
    setLoadingThread(true);
    setReplies([]);
    setError("");
    try {
      const res = await fetch(`/api/alumno/feed/${topic.id}`);
      if (!res.ok) throw new Error("Error cargando hilo");
      const data = await res.json();
      setActiveTopic(data.topic);
      setReplies(data.replies || []);
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoadingThread(false);
    }
  }

  // Send reply
  async function handleSendReply() {
    if (!replyText.trim() || !activeTopic) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/alumno/feed/${activeTopic.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error enviando respuesta");
      }
      setReplyText("");
      // Reload thread
      const res2 = await fetch(`/api/alumno/feed/${activeTopic.id}`);
      const data = await res2.json();
      setActiveTopic(data.topic);
      setReplies(data.replies || []);
      // Also update topic list count
      loadTopics();
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── Thread view ──
  if (activeTopic) {
    const authorName = `${activeTopic.author_first_name || ""} ${activeTopic.author_last_name || ""}`.trim();

    return (
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Thread header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3">
          <button
            onClick={() => { setActiveTopic(null); setReplies([]); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft size={16} /> Volver al feed
          </button>
          <div className="flex items-center gap-2">
            {activeTopic.pinned && <Pin size={14} className="text-blue-500" />}
            {activeTopic.category && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {activeTopic.category}
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-gray-900 mt-1">{activeTopic.title}</h1>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
          {/* Original post */}
          <div className="flex gap-3">
            <Avatar
              name={authorName}
              photo={activeTopic.author_photo as string | null}
              role={activeTopic.author_role as string}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-gray-900">{authorName}</span>
                {activeTopic.author_role === "SUPERADMIN" && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">ADMIN</span>
                )}
                <span className="text-xs text-gray-400">{timeAgo(activeTopic.created_at)}</span>
              </div>
              {activeTopic.body && (
                <div
                  className="mt-1 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none
                    [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2
                    [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5
                    [&>blockquote]:border-l-3 [&>blockquote]:border-gray-300 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-gray-500
                    [&_.callout]:bg-amber-50 [&_.callout]:border [&_.callout]:border-amber-200 [&_.callout]:rounded [&_.callout]:p-3 [&_.callout]:text-sm [&_.callout]:my-2
                    [&_.warning]:bg-red-50 [&_.warning]:border [&_.warning]:border-red-200 [&_.warning]:rounded [&_.warning]:p-3 [&_.warning]:text-sm [&_.warning]:my-2
                  "
                  dangerouslySetInnerHTML={{ __html: activeTopic.body }}
                />
              )}
            </div>
          </div>

          {/* Replies separator */}
          {replies.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 font-medium">
                {replies.length} {replies.length === 1 ? "respuesta" : "respuestas"}
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          )}

          {loadingThread && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {/* Replies */}
          {replies.map((reply) => {
            const rName = `${reply.author_first_name || ""} ${reply.author_last_name || ""}`.trim();
            return (
              <div key={reply.id} className="flex gap-3">
                <Avatar
                  name={rName}
                  photo={reply.author_photo as string | null}
                  role={reply.author_role as string}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-gray-900">{rName}</span>
                    {reply.author_role === "SUPERADMIN" && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">ADMIN</span>
                    )}
                    {reply.author_role === "MENTOR" && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">MENTOR</span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={repliesEndRef} />
        </div>

        {/* Reply input */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
              placeholder="Escribe una respuesta..."
              rows={1}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
              className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Pulsa Enter para enviar, Shift+Enter para nueva línea</p>
        </div>
      </div>
    );
  }

  // ── Topics list ──
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
        <p className="text-sm text-gray-500 mt-1">Temas de la comunidad. Participa en las conversaciones.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      {topics.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">Todavía no hay temas</p>
          <p className="text-sm mt-1">Los temas aparecerán aquí cuando el equipo los publique</p>
        </div>
      ) : (
        <div className="space-y-1">
          {topics.map((topic) => {
            const authorName = `${topic.author_first_name || ""} ${topic.author_last_name || ""}`.trim();
            return (
              <button
                key={topic.id}
                onClick={() => openThread(topic)}
                className={`w-full text-left rounded-lg p-4 hover:bg-gray-50 transition-colors group ${
                  topic.pinned ? "bg-blue-50/40 border border-blue-100" : "bg-white border border-gray-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={authorName}
                    photo={topic.author_photo}
                    role={topic.author_role}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {topic.pinned && <Pin size={12} className="text-blue-500 flex-shrink-0" />}
                      {topic.category && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                          {topic.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{timeAgo(topic.created_at)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{topic.title}</h3>
                    {topic.body && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {topic.body.replace(/<[^>]+>/g, "").slice(0, 120)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{authorName}</span>
                      {topic.reply_count > 0 && (
                        <span className="flex items-center gap-1 text-blue-500 font-medium">
                          <MessageSquare size={12} />
                          {topic.reply_count} {topic.reply_count === 1 ? "respuesta" : "respuestas"}
                        </span>
                      )}
                      {topic.last_reply_at && (
                        <span>Última actividad {timeAgo(topic.last_reply_at)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-2" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
