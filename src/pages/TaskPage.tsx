// src/pages/TaskPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { SurveyData } from "../types";
import { countSentences, countWords, now, API_BASE } from "../utils";

type SetDataLike = (
  updater: SurveyData | ((prev: SurveyData) => SurveyData)
) => void;

type Props = {
  data: SurveyData;
  setData: SetDataLike; // wrapper from App to autosave major blocks
  log: (type: string, meta?: any) => void;
  onPrev?: () => void;
  onNext: () => void;
};

type ChatMsg = { role: "user" | "assistant"; content: string; ts: number };

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function TaskPage(props: Props) {
  // --------- Writing state ----------
  const story = props.data.writing.storyText ?? "";
  const sentenceCount = useMemo(() => countSentences(story), [story]);
  const wordCount = useMemo(() => countWords(story), [story]);

  // --------- Timer (editor-active only) ----------
  const initialElapsed = (props.data.writing as any).elapsedMs ?? 0;
  const [localElapsedMs, setLocalElapsedMs] = useState<number>(initialElapsed);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const tickRef = useRef<number | null>(null);
  const lastTickAtRef = useRef<number>(Date.now());

  const persistElapsed = (ms: number) => {
    props.setData((d) => ({
      ...d,
      writing: { ...(d.writing as any), elapsedMs: ms },
    }));
  };

  // Ensure page starts at top when entering TaskPage
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    props.setData((d) => ({
      ...d,
      writing: { ...d.writing, startedAt: (d.writing as any).startedAt ?? now() },
    }));
    props.log("task_enter");

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      persistElapsed(localElapsedMs);
      props.log("task_leave", { elapsedMs: localElapsedMs });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      persistElapsed(localElapsedMs);
      return;
    }

    lastTickAtRef.current = Date.now();
    tickRef.current = window.setInterval(() => {
      const nowAt = Date.now();
      const delta = nowAt - lastTickAtRef.current;
      lastTickAtRef.current = nowAt;
      setLocalElapsedMs((prev) => {
        const next = prev + delta;
        // auto-save about every ~3s
        if (next % 3000 < 1000) persistElapsed(next);
        return next;
      });
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // --------- Chat state ----------
  const chatMessages: ChatMsg[] = (props.data.chat.messages ?? []) as ChatMsg[];
  const [input, setInput] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "reasoning" | "typing">(
    "idle"
  );
  const [thinkingDots, setThinkingDots] = useState(0);

  // Always hold the latest messages to avoid stale state across rapid sends
  const messagesRef = useRef<ChatMsg[]>(chatMessages);
  useEffect(() => {
    messagesRef.current = chatMessages;
  }, [chatMessages]);

  // IMPORTANT: scroll ONLY inside chat container (avoid window scroll jumps)
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollChatToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const isChatNearBottom = () => {
    const el = chatScrollRef.current;
    if (!el) return true;
    const threshold = 80; // px
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  useEffect(() => {
    if (aiStatus !== "reasoning") return;
    const t = window.setInterval(() => setThinkingDots((d) => (d + 1) % 4), 350);
    return () => window.clearInterval(t);
  }, [aiStatus]);

  // Auto-scroll chat container only (never scroll window)
  useEffect(() => {
    if (aiStatus !== "idle" || isChatNearBottom()) {
      scrollChatToBottom("auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages.length, aiStatus]);

  // Persist one chat turn to DB
  const persistChatTurn = (
    role: "user" | "assistant",
    content: string,
    turn_index: number
  ) => {
    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id || !content) return;

    if (role === "assistant" && content.includes("系統暫時無法回應")) return;

    fetch(`${API_BASE}/api/chatlog`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id, turn_index, role, content: content.trim() }),
    }).catch(console.error);
  };

  const simulateTypewriter = async (fullText: string) => {
    setAiStatus("typing");

    const tempTs = now();
    props.setData((d) => ({
      ...d,
      chat: {
        ...d.chat,
        messages: [...(d.chat.messages ?? []), { role: "assistant", content: "", ts: tempTs }],
      },
    }));

    let currentText = "";
    const chunkSize = 20;
    const delayMs = 15;

    for (let i = 0; i < fullText.length; i += chunkSize) {
      currentText += fullText.slice(i, i + chunkSize);

      props.setData((d) => {
        const newMsgs = [...(d.chat.messages ?? [])];
        // last should be the typing placeholder
        newMsgs[newMsgs.length - 1] = {
          ...(newMsgs[newMsgs.length - 1] as any),
          content: currentText,
        };
        return { ...d, chat: { ...d.chat, messages: newMsgs } };
      });

      await new Promise((res) => setTimeout(res, delayMs));
    }

    setAiStatus("idle");
    props.setData((d) => ({
      ...d,
      chat: {
        ...d.chat,
        stats: {
          ...d.chat.stats,
          totalReplyChars: d.chat.stats.totalReplyChars + fullText.length,
        },
      },
    }));
  };

  // FULL onSend: unlimited multi-turn, always uses latest convo, robust HTTP handling
  const onSend = async () => {
    const prompt = input.trim();
    if (!prompt || aiStatus !== "idle") return;

    setInput("");
    
    props.log("ai_prompt_send", { chars: prompt.length });

    // ALWAYS use latest messages (avoid stale closure)
    const currentMsgs = messagesRef.current ?? [];
    const userTurnIndex = currentMsgs.length;

    const userMsg: ChatMsg = { role: "user", content: prompt, ts: now() };

    // Update UI immediately
    props.setData((d) => ({
      ...d,
      chat: {
        ...d.chat,
        messages: [...(d.chat.messages ?? []), userMsg],
        stats: {
          ...d.chat.stats,
          promptCount: d.chat.stats.promptCount + 1,
          totalPromptChars: d.chat.stats.totalPromptChars + prompt.length,
        },
      },
    }));

    // Persist user turn once
    persistChatTurn("user", prompt, userTurnIndex);

    setAiStatus("reasoning");

    // Send FULL conversation (like real chat). Do not slice here.
    const fullConversation = [
      ...currentMsgs.map((m) => ({ 
        role: m.role, 
        content: typeof m.content === "string" ? m.content : String(m.content ?? "") 
      })),
      { role: "user" as const, content: prompt },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/chat`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: fullConversation }),
      });

      // IMPORTANT: check status; if fail, read text for debugging
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP_${res.status}`);
      }

      const json = await res.json();
      const replyText =
        json?.reply && typeof json.reply === "string" && json.reply.trim()
          ? json.reply
          : "（系統暫時無法回應，請稍後再試）";

      // Typewriter (UI only)
      await simulateTypewriter(replyText);

      persistChatTurn("assistant", replyText, userTurnIndex + 1);

      props.log("ai_reply_received", { chars: replyText.length });
    } catch (e) {
      console.error("chat error:", e);
      const fallback = "（系統暫時無法回應，請稍後再試）";

      // Show fallback as assistant message
      await simulateTypewriter(fallback);
    }
  };

  const onSubmit = async () => {
    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id || isSubmitting) return; 

    setIsSubmitting(true); 
    persistElapsed(localElapsedMs);

    const taskData = {
      id: participant_id,
      story_text: story,
      sentence_count: sentenceCount,
      word_count: wordCount,
      task_page_elapsed_ms: localElapsedMs,
      ai_chat_log: messagesRef.current 
    };

    try {
      const res = await fetch(`${API_BASE}/api/survey/update`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) throw new Error("Update survey_results failed");

      props.setData((d) => ({
        ...d,
        writing: {
          ...(d.writing as any),
          submittedAt: now(),
          sentenceCount,
          wordCount,
          elapsedMs: localElapsedMs,
        },
      }));
      
      props.log("task_submit", { sentenceCount, wordCount, elapsedMs: localElapsedMs });
      props.onNext();
    } catch (e) {
      console.error("Submit error:", e);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false); 
    }
  };

  // --------- UI helpers ----------
  const sentenceOk = sentenceCount >= 5;
  const chipBase: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,0.10)",
    background: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#0f172a",
  };
  const sentenceChip: CSSProperties = {
    ...chipBase,
    color: sentenceOk ? "var(--primary)" : "#0f172a",
  };
  const timeChip: CSSProperties = {
    ...chipBase,
    color: isActive ? "var(--primary)" : "#0f172a",
  };

  return (
    <div className="vstack">
      <div className="card vstack">
        {/* Title */}
        <div className="panel">
          <div className="pageTitle" style={{ textAlign: "center" }}>
            廣告創意寫作任務
          </div>
        </div>

        {/* Tier 1: Product Briefing */}
        <div className="panel vstack">
          <div className="sectionTitleZh">一、產品資訊</div>
          <div style={{ marginTop: 10, lineHeight: 1.9 }}>
            <div>
              <span style={{ fontWeight: 900 }}>產品名稱：</span>
              <span style={{ fontWeight: 900, color: "var(--primary)" }}>
                SmartBottle
              </span>{" "}
              — 智慧保溫瓶
            </div>
            <div>
              <span style={{ fontWeight: 900 }}>核心功能：</span>
              內建智能震動提醒，定時提示補充水分，守護您的健康。
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <img
              src="/images/smartbottle.png"
              alt="SmartBottle"
              style={{
                width: "80%",
                maxWidth: 920,
                borderRadius: 14,
                border: "1px solid rgba(15,23,42,0.10)",
                boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
              }}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="small" style={{ fontWeight: 900 }}>
              評估標準：
            </div>
            <ul
              style={{
                margin: "8px 0 0",
                paddingLeft: 18,
                lineHeight: 1.9,
                color: "#334155",
              }}
            >
              <li>
                <b>創意：</b>廣告是否新穎、有想像力。
              </li>
              <li>
                <b>情感連結：</b>廣告是否能引起情感連結。
              </li>
              <li>
                <b>說服力：</b>廣告是否能讓人想要嘗試或購買該產品。
              </li>
            </ul>
          </div>
          <div className="small" style={{ marginTop: 10, color: "#64748b" }}>
            * 必填要求：內容至少{" "}
            <span style={{ fontWeight: 900, color: "var(--primary)" }}>
              5 句以上
            </span>
            。
          </div>
        </div>

        {/* Tier 2: ChatGPT */}
        <div className="panel vstack">
          <div
            className="sectionTitleZh"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            二、ChatGPT
          </div>

          <div
            className="small"
            style={{ marginTop: 6, color: "#475569", lineHeight: "1.7" }}
          >
            <span style={{ fontWeight: "900", color: "#0f172a" }}>
              注意事項：
            </span>
            <br />
            • 本研究提供之 AI 協作功能，請依您的實本研究所提供之 AI 協作功能，請您依自身實際需求，自行決定是否使用。
            <br />
            •{" "}
            <span
              style={{
                color: "var(--danger)",
                fontWeight: "900",
                textDecoration: "underline",
              }}
            >
              請注意
            </span>
            : 除本頁面提供之系統外，
            <span style={{ fontWeight: "900" }}>嚴禁使用</span>
            任何其他外部 AI 工具.
          </div>

          <div
            style={{
              marginTop: 10,
              border: "1px solid rgba(15,23,42,0.10)",
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {/* Chat header */}
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(109,46,112,0.06)",
                borderBottom: "1px solid rgba(15,23,42,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: "var(--primary)",
                    opacity: 0.9,
                  }}
                />
                <div style={{ fontWeight: 900 }}>ChatGPT</div>
              </div>
              <div className="small" style={{ color: "var(--primary)" }}>
                {aiStatus === "reasoning"
                  ? `正在推理${"·".repeat(thinkingDots)}`
                  : aiStatus === "typing"
                  ? "正在輸入..."
                  : "就緒"}
              </div>
            </div>

            {/* Chat body */}
            <div
              ref={chatScrollRef}
              style={{
                maxHeight: 320,
                overflowY: "auto",
                padding: 12,
                background: "#f8fafc",
              }}
            >
              {chatMessages.length === 0 && aiStatus === "idle" && (
                <div className="small" style={{ color: "#64748b" }}>
                  您可以詢問：故事切入點、產品特色如何自然融入等.
                </div>
              )}

              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent:
                      m.role === "user" ? "flex-end" : "flex-start",
                    margin: "10px 0",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "86%",
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.10)",
                      background:
                        m.role === "user" ? "rgba(109,46,112,0.12)" : "#fff",
                      whiteSpace: "pre-line",
                    }}
                  >
                    <div
                      className="small"
                      style={{
                        fontWeight: 900,
                        color: "#475569",
                        marginBottom: 4,
                      }}
                    >
                      {m.role === "user" ? "你" : "ChatGPT"}
                    </div>
                    {m.content}
                  </div>
                </div>
              ))}

              {aiStatus === "reasoning" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    margin: "10px 0",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "86%",
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.10)",
                      background: "#fff",
                    }}
                  >
                    <div
                      className="small"
                      style={{
                        fontWeight: 900,
                        color: "#475569",
                        marginBottom: 4,
                      }}
                    >
                      ChatGPT
                    </div>
                    <span style={{ color: "#64748b", fontWeight: 800 }}>
                      正在推理{".".repeat(thinkingDots)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            <div
              style={{
                padding: 10,
                borderTop: "1px solid rgba(15,23,42,0.08)",
                display: "flex",
                gap: 10,
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="詢問寫作建議..."
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  padding: "0 12px",
                  outline: "none",
                }}
              />
              <button
                onClick={onSend}
                disabled={aiStatus !== "idle" || !input.trim()}
                style={{
                  height: 44,
                  padding: "0 14px",
                  borderRadius: 10,
                  background:
                    aiStatus !== "idle" || !input.trim()
                      ? "#ccc"
                      : "var(--primary)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                送出
              </button>
            </div>
          </div>
        </div>

        {/* Tier 3: Writing Area */}
        <div className="panel vstack">
          <div className="sectionTitleZh">三、廣告撰寫區</div>
          <textarea
            value={story}
            onChange={(e) => {
              props.setData((d) => ({
                ...d,
                writing: { ...d.writing, storyText: e.target.value },
              }));
              props.log("editor_change", { chars: e.target.value.length });
            }}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            placeholder="請在此撰寫（至少 5 句）."
            style={{
              width: "100%",
              minHeight: 260,
              marginTop: 12,
              borderRadius: 14,
              border: "1px solid #ddd",
              padding: 14,
              lineHeight: 1.75,
              outline: "none",
              resize: "vertical",
            }}
          />

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div style={sentenceChip}>✍️ 已完成 {sentenceCount} / 5 句</div>
              <div style={timeChip}>
                ⏳ {formatTime(localElapsedMs)}{" "}
                {isActive ? "（計時中）" : "（暫停）"}
              </div>
              <div style={chipBase}>🧮 字數 {wordCount}</div>
            </div>
          </div>

          <div
            className="btnRow"
            style={{ justifyContent: "flex-start", gap: 12, marginTop: 14 }}
          >
            <button
              onClick={() => {
                persistElapsed(localElapsedMs);
                if (props.onPrev) props.onPrev();
              }}
              disabled={!props.onPrev || isSubmitting}
            >
              上一步
            </button>
            <button
              className="primary"
              disabled={sentenceOk === false || isSubmitting} 
              onClick={onSubmit}
            >
              {isSubmitting ? "儲存中..." : "提交作品"}
            </button>
          </div>

          {!sentenceOk && !isSubmitting && (
            <div
              className="small"
              style={{ color: "var(--danger)", fontWeight: 900, marginTop: 10 }}
            >
              請完成至少 5 句後再提交.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}