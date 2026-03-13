// src/pages/TaskPageCond2.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, TextareaHTMLAttributes } from "react";
import type { SurveyData } from "../types";
import { API_BASE, countSentences, now } from "../utils";

type SetDataLike = (
  updater: SurveyData | ((prev: SurveyData) => SurveyData)
) => void;

type Props = {
  data: SurveyData;
  setData: SetDataLike;
  log: (type: string, meta?: any) => void;
  onPrev?: () => void;
  onNext: () => void;
};

type ChatMsg = {
  role: "assistant";
  content: string;
  ts: number;
};

const THINKING_STEPS = [
  "正在分析使用者提供的構想……",
  "整理目標對象與使用情境……",
  "生成完整的故事型廣告內容……",
];

function ChatGPTLogo({ small = false }: { small?: boolean }) {
  return (
    <img
      src="/images/chatgpt-logo.png"
      alt="ChatGPT"
      style={{
        width: small ? 28 : 36,
        height: small ? 28 : 36,
        borderRadius: 8,
        objectFit: "contain",
        background: "#fff",
        flexShrink: 0,
      }}
    />
  );
}

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function CompactAutoTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      rows={1}
      onInput={(e) => {
        autoGrow(e.currentTarget);
        props.onInput?.(e);
      }}
      style={{
        width: "100%",
        minHeight: 46,
        maxHeight: 180,
        borderRadius: 14,
        border: "1px solid #ddd",
        padding: "8px 12px",
        lineHeight: 1.5,
        fontSize: 14,
        outline: "none",
        resize: "none",
        overflow: "hidden",
        ...props.style,
      }}
    />
  );
}

export default function TaskPageCond2(props: Props) {
  const story = props.data.writing.storyText ?? "";
  const sentenceCount = useMemo(() => countSentences(story), [story]);
  const wordCount = useMemo(() => countWords(story), [story]);

  const initialElapsed = (props.data.writing as any).elapsedMs ?? 0;
  const [localElapsedMs, setLocalElapsedMs] = useState<number>(initialElapsed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const elapsedMsRef = useRef<number>(initialElapsed);

  const tickRef = useRef<number | null>(null);
  const lastTickAtRef = useRef<number>(Date.now());
  const isPageVisibleRef = useRef<boolean>(!document.hidden);
  const generatingRef = useRef(false);

  const persistElapsed = (ms: number) => {
    props.setData((d) => ({
      ...d,
      writing: { ...(d.writing as any), elapsedMs: ms },
    }));
  };

  const cond2Form = ((props.data.chat as any)?.cond2Form ?? {}) as {
    targetAudience?: string;
    usageScenario?: string;
    additionalRequirements?: string;
  };

  const targetAudience = cond2Form.targetAudience ?? "";
  const usageScenario = cond2Form.usageScenario ?? "";
  const additionalRequirements = cond2Form.additionalRequirements ?? "";

  const setCond2FormField = (
    key: "targetAudience" | "usageScenario" | "additionalRequirements",
    value: string
  ) => {
    props.setData((d) => ({
      ...d,
      chat: {
        ...(d.chat as any),
        cond2Form: {
          ...((d.chat as any)?.cond2Form ?? {}),
          [key]: value,
        },
      } as any,
    }));
  };

  const chatMessages: ChatMsg[] = (((props.data.chat.messages ?? []) as any[]) || []).filter(
    (m) => m?.role === "assistant"
  ) as ChatMsg[];

  const versionCount = Math.min(chatMessages.length, 3);
  const selectedStoryIndex = (props.data.chat as any).selectedStoryIndex ?? null;

  const sentenceOk = sentenceCount >= 5;
  const hasGenerated = versionCount >= 1;
  const hasSelectedStory =
    selectedStoryIndex !== null && selectedStoryIndex !== undefined;

  const canGenerate =
    targetAudience.trim().length > 0 &&
    usageScenario.trim().length > 0 &&
    versionCount < 3 &&
    !isSubmitting;

  const [aiStatus, setAiStatus] = useState<"idle" | "thinking" | "typing">("idle");
  const [thinkingStepIndex, setThinkingStepIndex] = useState(0);

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
  elapsedMsRef.current = localElapsedMs;
}, [localElapsedMs]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    props.setData((d) => ({
  ...d,
  writing: {
    ...d.writing,
    startedAt: (d.writing as any).startedAt ?? now(),
  },
}));

    props.log("task_cond2_enter");

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      props.log("task_cond2_leave", { elapsedMs: elapsedMsRef.current });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const startTimer = () => {
      if (tickRef.current) window.clearInterval(tickRef.current);

      lastTickAtRef.current = Date.now();
      tickRef.current = window.setInterval(() => {
        if (!isPageVisibleRef.current) return;

        const nowAt = Date.now();
        const delta = nowAt - lastTickAtRef.current;
        lastTickAtRef.current = nowAt;

        setLocalElapsedMs((prev) => {
          const next = prev + delta;
          if (next % 3000 < 1000) persistElapsed(next);
          return next;
        });
      }, 1000);
    };

    startTimer();

    const onVisibilityChange = () => {
  isPageVisibleRef.current = !document.hidden;
  lastTickAtRef.current = Date.now();
  persistElapsed(elapsedMsRef.current);
};

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (aiStatus !== "thinking") return;

    const stepTimer = window.setInterval(() => {
      setThinkingStepIndex((i) => Math.min(i + 1, THINKING_STEPS.length - 1));
    }, 900);

    return () => {
      window.clearInterval(stepTimer);
    };
  }, [aiStatus]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [chatMessages.length, aiStatus]);

  const persistChatTurn = async (content: string, turnIndex: number) => {
    const participantId = sessionStorage.getItem("participant_id");
    if (!participantId || !content.trim()) return;

    try {
      await fetch(`${API_BASE}/api/chatlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          turn_index: turnIndex,
          role: "assistant",
          content: content.trim(),
        }),
      });
    } catch (e) {
      console.error("chatlog save error:", e);
    }
  };

  const simulateTypewriter = async (fullText: string) => {
    setAiStatus("typing");

    const tempTs = now();

    props.setData((d) => ({
      ...d,
      chat: {
        ...d.chat,
        messages: [
          ...(d.chat.messages ?? []),
          { role: "assistant", content: "", ts: tempTs },
        ],
      } as any,
    }));

    let currentText = "";
    let i = 0;

    while (i < fullText.length) {
      const chunkSize = Math.floor(Math.random() * 4) + 2;
      const delay = 40 + Math.random() * 60;
      const chunk = fullText.slice(i, i + chunkSize);

      currentText += chunk;
      i += chunkSize;

      props.setData((d) => {
        const newMsgs = [...(d.chat.messages ?? [])];
        newMsgs[newMsgs.length - 1] = {
          ...(newMsgs[newMsgs.length - 1] as any),
          content: currentText,
        };

        return {
          ...d,
          chat: {
            ...d.chat,
            messages: newMsgs,
          } as any,
        };
      });

      scrollToBottom("smooth");

      if (chunk.includes("\n")) {
        await new Promise((r) => setTimeout(r, 120));
      }

      await new Promise((r) => setTimeout(r, delay));
    }

    setAiStatus("idle");

    props.setData((d) => ({
  ...d,
  chat: {
    ...d.chat,
    stats: {
      ...(d.chat.stats ?? {}),
      totalReplyChars: ((d.chat.stats?.totalReplyChars) ?? 0) + fullText.length,
    },
  } as any,
}));
  };

  const buildStoryText = (json: any) => {
    if (typeof json?.story === "string" && json.story.trim()) return json.story.trim();
    if (typeof json?.reply === "string" && json.reply.trim()) return json.reply.trim();
    if (typeof json?.content === "string" && json.content.trim()) return json.content.trim();
    return "（系統暫時無法回應，請稍後再試）";
  };

  const onGenerateStory = async () => {
  if (generatingRef.current || aiStatus !== "idle" || versionCount >= 3) return;
  generatingRef.current = true;

  if (!targetAudience.trim() || !usageScenario.trim()) {
    generatingRef.current = false;
    alert("請先填寫「目標對象」與「使用情境」。");
    return;
  }

  props.log("ai_story_generate_click", {
    currentStoryCount: versionCount,
    hasAdditionalRequirements: !!additionalRequirements.trim(),
  });

  setAiStatus("thinking");
  setThinkingStepIndex(0);

  try {
    const res = await fetch(`${API_BASE}/api/cond2/generate-story`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetAudience: targetAudience.trim(),
        usageScenario: usageScenario.trim(),
        additionalRequirements: additionalRequirements.trim(),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP_${res.status}`);
    }

    const json = await res.json();
    const storyText = buildStoryText(json);

    await new Promise((r) => setTimeout(r, 1200));
    await simulateTypewriter(storyText);
    await persistChatTurn(storyText, versionCount + 1);

    props.log("ai_story_received", {
      storyIndex: versionCount + 1,
      chars: storyText.length,
    });
  } catch (e) {
    console.error("story generation error:", e);
    setAiStatus("idle");
    alert("AI 內容生成失敗，請稍後再試。");
  } finally {
    generatingRef.current = false;
  }
};

  const onSelectStory = (idx: number) => {
    const selectedText = chatMessages[idx]?.content ?? "";

    props.setData((d) => ({
      ...d,
      writing: {
        ...d.writing,
        storyText: selectedText,
      },
      chat: {
        ...d.chat,
        selectedStoryIndex: idx,
        selectedStoryText: selectedText,
      } as any,
    }));

    props.log("ai_story_selected", { storyIndex: idx + 1 });
  };

  const onSubmit = async () => {
    const participantId = sessionStorage.getItem("participant_id");
    if (!participantId || isSubmitting) return;

    if (!hasGenerated) {
      alert("請先至少生成 1 個版本。");
      return;
    }

    if (!hasSelectedStory) {
      alert("請先選擇 1 個版本。");
      return;
    }

    if (!sentenceOk) {
      alert("請完成至少 5 句後再提交。");
      return;
    }

    setIsSubmitting(true);
    persistElapsed(elapsedMsRef.current);

    const selectedStoryText =
      selectedStoryIndex !== null && selectedStoryIndex !== undefined
        ? chatMessages[selectedStoryIndex]?.content ?? ""
        : "";

    const payload = {
      id: participantId,
      submitted_ad_text: story,
      submitted_ad_word_count: wordCount,
      submitted_ad_sentence_count: sentenceCount,
      task_active_seconds_total: Math.round(localElapsedMs / 1000),
      generate_count: versionCount,

      cond2_structure_form_1: targetAudience.trim(),
      cond2_structure_form_2: usageScenario.trim(),
      cond2_structure_form_3: additionalRequirements.trim(),

      cond2_story_1_text: chatMessages[0]?.content ?? "",
      cond2_story_2_text: chatMessages[1]?.content ?? "",
      cond2_story_3_text: chatMessages[2]?.content ?? "",
      cond2_selected_story_index:
        selectedStoryIndex !== null && selectedStoryIndex !== undefined
          ? selectedStoryIndex + 1
          : null,
      cond2_selected_story_text: selectedStoryText,
    };

    try {
      const res = await fetch(`${API_BASE}/api/survey/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        throw new Error(text || "Update survey_results failed");
      }

      props.setData((d) => ({
        ...d,
        writing: {
          ...(d.writing as any),
          submittedAt: now(),
          sentenceCount,
          elapsedMs: localElapsedMs,
        },
      }));

      props.log("task_cond2_submit", {
        sentenceCount,
        wordCount,
        elapsedMs: localElapsedMs,
        versionCount,
        selectedStoryIndex,
      });

      props.onNext();
    } catch (e) {
      console.error("Submit error:", e);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const statusText =
    aiStatus === "thinking"
      ? "分析中…"
      : aiStatus === "typing"
      ? "生成中…"
      : versionCount > 0
      ? "完成"
      : "待命中";

  return (
    <div className="vstack">
      <div className="card vstack">
        <div className="panel" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <div
            className="pageTitle"
            style={{
              textAlign: "center",
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 1.2,
              color: "var(--text)",
            }}
          >
            廣告創意寫作任務
          </div>
        </div>

        <div className="panel vstack" style={{ gap: 0 }}>
          <div
            className="sectionTitleZh"
            style={{
              fontSize: 21,
              fontWeight: 900,
              color: "var(--text)",
              lineHeight: 1.35,
            }}
          >
            一、你的任務
          </div>

          <div
            style={{
              marginTop: 12,
              lineHeight: 1.9,
              fontSize: 16,
              color: "var(--text)",
            }}
          >
            <div style={{ marginTop: 6 }}>
              請撰寫一篇 <span className="hl"><b>故事型廣告</b></span>，推廣以下產品。
            </div>
          </div>

          <div style={{ marginTop: 12 }} className="taskMeta">
            <div className="taskMetaRow">
              <span className="taskMetaLabel">產品：</span>
              <span className="taskMetaValue">SmartBottle</span>
              <span style={{ color: "#475569" }}>— 智慧保溫瓶</span>
            </div>
            <div className="taskMetaRow">
              <span className="taskMetaLabel">核心功能：</span>
              <span>內建智能震動提醒，定時提示補充水分，守護您的健康。</span>
            </div>
            <div className="taskMetaRow">
              <span className="taskMetaLabel">句數要求：</span>
              <span className="taskMetaValue">至少 5 句以上</span>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(180,83,9,0.18)",
              background: "rgba(245,158,11,0.08)",
              color: "#92400e",
              fontSize: 14,
              fontWeight: 800,
              lineHeight: 1.7,
            }}
          >
            追加獎勵：表現優異之前三名作品，可能獲得額外獎金 1000 元等值的 7-11 禮券。
          </div>

          <div
            style={{
              marginTop: 14,
              borderRadius: 14,
              overflow: "hidden",
              background: "#e9e2d8",
              border: "1px solid rgba(15,23,42,0.08)",
              display: "flex",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <img
              src="/images/smartbottle.png"
              alt="SmartBottle"
              style={{
                width: "100%",
                maxWidth: 420,
                height: "auto",
                borderRadius: 12,
              }}
            />
          </div>
        </div>

        <div className="panel vstack" style={{ gap: 0 }}>
          <div
            className="sectionTitleZh"
            style={{
              fontSize: 21,
              fontWeight: 900,
              color: "var(--text)",
              lineHeight: 1.35,
            }}
          >
            二、操作說明
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(124,58,237,0.10)",
              background: "rgba(124,58,237,0.03)",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#334155",
                marginBottom: 8,
              }}
            >
              操作步驟
            </div>

            <ol
  style={{
    margin: 0,
    paddingLeft: 20,
    lineHeight: 1.9,
    fontSize: 15,
    color: "var(--text)",
  }}
>
  <li>
    請在下方表單中輸入幾個<span className="hl">關鍵構想</span>，用來描述您希望廣告呈現的內容。
  </li>
  <li>
    點擊 <span className="hl">Generate</span>，讓 AI 依據您的構想生成
    <span className="hl">完整的故事型廣告</span>。
  </li>
  <li>
    您最多可生成 <span className="hl">3 個版本</span>。
  </li>
  <li>
    請從中選擇一個版本作為最終提交（可自行修改）。
  </li>
</ol>

            <div
              style={{
                marginTop: 12,
                fontSize: 15,
                fontWeight: 900,
                color: "var(--danger)",
                lineHeight: 1.7,
              }}
            >
              * 重要提醒
            </div>

            <ul
  style={{
    margin: "6px 0 0",
    paddingLeft: 20,
    lineHeight: 1.8,
    fontSize: 15,
    color: "var(--text)",
  }}
>
  <li>
    請勿使用任何其他外部 AI。

  </li>
</ul>
          </div>
        </div>

        <div className="panel vstack" style={{ gap: 0 }}>
          <div
            className="sectionTitleZh"
            style={{
              fontSize: 21,
              fontWeight: 900,
              color: "var(--text)",
              lineHeight: 1.35,
            }}
          >
            三、ChatGPT
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 18,
              lineHeight: 1.8,
              color: "#000000ff",
            }}
          >
            請輸入關鍵構想，並點擊 Generate 生成故事型廣告。
            <div
  style={{
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
  }}
>
  以下輸入框中的內容為「SmartWallet」示例，僅用於說明格式；請依照 SmartBottle（智慧保溫瓶）產品自行構想。
</div>
          </div>

          <div
  style={{
    marginTop: 14,
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 14,
    }}
  >
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "#fff",
                }}
              >
                <div
  style={{
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "nowrap",
    marginBottom: 8,
  }}
>
  <span
  style={{
    fontSize: 15,
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.4,
    flexShrink: 0,
  }}
>
  故事中的主要人物<span style={{ color: "#ef4444" }}> *</span>
</span>
</div>
                <CompactAutoTextarea
                  value={targetAudience}
                  disabled={aiStatus !== "idle" || isSubmitting}
                  onChange={(e) => {
                    setCond2FormField("targetAudience", e.target.value);
                    props.log("cond2_form_change", { field: "targetAudience" });
                  }}
                  placeholder="例如：生活忙碌、經常趕時間的年輕媽媽"
                />
              </div>

              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "#fff",
                }}
              >
                <div
  style={{
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "nowrap",
    marginBottom: 8,
  }}
>
  <span
  style={{
    fontSize: 15,
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.4,
    flexShrink: 0,
  }}
>
  故事發生的情境<span style={{ color: "#ef4444" }}> *</span>
</span>
</div>
                <CompactAutoTextarea
                  value={usageScenario}
                  disabled={aiStatus !== "idle" || isSubmitting}
                  onChange={(e) => {
                    setCond2FormField("usageScenario", e.target.value);
                    props.log("cond2_form_change", { field: "usageScenario" });
                  }}
                  placeholder="例如：出門前突然找不到錢包、感到焦急的情境"
                />
              </div>

              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "#fff",
                }}
              >
                <div
  style={{
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "nowrap",
    marginBottom: 8,
  }}
>
  <span
  style={{
    fontSize: 15,
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.4,
    flexShrink: 0,
  }}
>
  額外要求（選填）
</span>
<span
  style={{
    fontSize: 12,
    lineHeight: 1.4,
    color: "#64748b",
    whiteSpace: "nowrap",
  }}
>
  （故事風格、語氣或其他補充說明）
</span>
</div>
                <CompactAutoTextarea
                  value={additionalRequirements}
                  disabled={aiStatus !== "idle" || isSubmitting}
                  onChange={(e) => {
                    setCond2FormField("additionalRequirements", e.target.value);
                    props.log("cond2_form_change", { field: "additionalRequirements" });
                  }}
                  placeholder="例如：節奏緊湊、貼近日常壓力"
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              className="primary"
              onClick={onGenerateStory}
              disabled={!canGenerate || aiStatus !== "idle"}
              style={{
                minHeight: 42,
                padding: "0 18px",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              {aiStatus === "thinking" || aiStatus === "typing" ? "產生中..." : "Generate"}
            </button>

            <div
              className="small"
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "#64748b",
                fontWeight: 800,
              }}
            >
              生成次數：{versionCount} / 3
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              border: "1px solid rgba(15,23,42,0.10)",
              borderRadius: 18,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                background: "#fafafa",
                borderBottom: "1px solid rgba(15,23,42,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ChatGPTLogo small />
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>
                    ChatGPT
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
                {statusText}
              </div>
            </div>

            <div
              ref={scrollAreaRef}
              className="chat-scroll"
              style={{
                height: 250,
                overflowY: "auto",
                padding: 22,
                background: "#fafafa",
              }}
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className="chatBubble"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    marginBottom: 18,
                  }}
                >
                  <ChatGPTLogo small />

                  <div
                    style={{
                      maxWidth: 560,
                      padding: "16px 18px",
                      borderRadius: 18,
                      border: "1px solid rgba(15,23,42,0.08)",
                      background: "#fff",
                      lineHeight: 1.9,
                      fontSize: 15,
                      color: "#0f172a",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {aiStatus === "thinking" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <ChatGPTLogo />

                  <div
                    style={{
                      maxWidth: 560,
                      padding: "16px 18px",
                      borderRadius: 18,
                      border: "1px solid rgba(15,23,42,0.08)",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#475569",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>▼</span>
                      <span>思考中</span>
                      <span style={{ color: "#a78bfa", fontWeight: 900 }}>
                        <span className="thinkingDots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        borderLeft: "3px solid rgba(15,23,42,0.08)",
                        paddingLeft: 12,
                        color: "#667085",
                        fontStyle: "italic",
                        lineHeight: 1.9,
                        fontSize: 14,
                      }}
                    >
                      {THINKING_STEPS.slice(0, thinkingStepIndex + 1).map((step, idx) => (
                        <div key={idx}>{step}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {aiStatus === "idle" && versionCount === 0 && (
  <div
    style={{
      color: "#6b7280",
      lineHeight: 1.8,
      fontSize: 14,
      fontStyle: "italic",
    }}
  >
    請先填寫上方構想後，再點擊「Generate」。
    <br />
    生成次數：0 / 3
  </div>
)}
            </div>
          </div>

          <div
  style={{
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.85,
    color: "#334155",
    fontWeight: 700,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(124,58,237,0.05)",
    border: "1px solid rgba(124,58,237,0.10)",
  }}
>
  選擇<span className="hl">版本</span>後，內容將<span className="hl">自動帶入</span>下方寫作區。
  您<span className="hl">不需要自行複製</span>，可直接再修改或補充。
</div>

          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}
          >
            {[0, 1, 2].map((idx) => {
              const versionText = chatMessages[idx]?.content ?? "";
              const selected = selectedStoryIndex === idx;
              const hasStory = !!versionText;

              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: 14,
                    border: selected
                      ? "2px solid var(--primary)"
                      : "1px solid rgba(15,23,42,0.10)",
                    background: selected ? "rgba(124,58,237,0.04)" : "#fff",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: "var(--text)",
                      }}
                    >
                      版本 {idx + 1}
                    </div>

                    <button
                      type="button"
                      disabled={!hasStory}
                      onClick={() => onSelectStory(idx)}
                      style={{
                        minHeight: 36,
                        padding: "0 12px",
                        borderRadius: 10,
                        border: selected
                          ? "1px solid var(--primary)"
                          : "1px solid rgba(15,23,42,0.12)",
                        background: selected ? "var(--primary)" : "#fff",
                        color: selected ? "#fff" : "#0f172a",
                        fontWeight: 800,
                        cursor: hasStory ? "pointer" : "default",
                        opacity: hasStory ? 1 : 0.6,
                      }}
                    >
                      {selected ? "已選擇" : "選擇此版本"}
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      lineHeight: 1.85,
                      fontSize: 15,
                      color: hasStory ? "var(--text)" : "#94a3b8",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {hasStory ? versionText : "尚未生成"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel vstack" style={{ gap: 0 }}>
          <div
            className="sectionTitleZh"
            style={{
              fontSize: 21,
              fontWeight: 900,
              color: "var(--text)",
              lineHeight: 1.35,
            }}
          >
            四、廣告撰寫區
          </div>

          <textarea
            value={story}
            onChange={(e) => {
              props.setData((d) => ({
                ...d,
                writing: { ...d.writing, storyText: e.target.value },
              }));
              props.log("editor_change_cond2", { chars: e.target.value.length });
            }}
            placeholder="請在此確認並編輯最終的故事型廣告內容……"
            style={{
              width: "100%",
              minHeight: 260,
              marginTop: 10,
              borderRadius: 14,
              border: "1px solid #ddd",
              padding: 14,
              lineHeight: 1.8,
              fontSize: 15,
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
            }}
          >
            <div style={sentenceChip}>✍️ 已完成 {sentenceCount} / 5 句</div>
          </div>

          <div
            className="btnRow"
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            <button
              onClick={() => {
                persistElapsed(localElapsedMs);
                if (props.onPrev) props.onPrev();
              }}
              disabled={!props.onPrev || isSubmitting}
              style={{
                minHeight: 42,
                padding: "0 18px",
                fontSize: 15,
              }}
            >
              上一步
            </button>

            <button
              className="primary"
              disabled={!sentenceOk || !hasGenerated || !hasSelectedStory || isSubmitting}
              onClick={onSubmit}
              style={{
                minHeight: 42,
                padding: "0 18px",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              {isSubmitting ? "儲存中..." : "提交作品"}
            </button>
          </div>

          {!isSubmitting && (
            <div
              className="small"
              style={{
                color: "var(--danger)",
                fontWeight: 900,
                marginTop: 10,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              {!targetAudience.trim() && <div>請先填寫「目標對象」。</div>}
              {!usageScenario.trim() && <div>請先填寫「使用情境」。</div>}
              {!hasGenerated && targetAudience.trim() && usageScenario.trim() && (
                <div>請先至少生成 1 個版本。</div>
              )}
              {hasGenerated && !hasSelectedStory && <div>請先選擇 1 個版本。</div>}
              {!sentenceOk && <div>請完成至少 5 句後再提交。</div>}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .taskMeta {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .taskMetaRow {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 16px;
          line-height: 1.8;
        }
        .taskMetaLabel {
          font-weight: 900;
          color: #0f172a;
          min-width: 84px;
        }
        .taskMetaValue {
          font-weight: 900;
          color: var(--primary);
        }
        .chatBubble {
          animation: fadeInUp 0.25s ease;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .thinkingDots span {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 3px;
          border-radius: 50%;
          background: #a78bfa;
          animation: blink 1.2s infinite;
        }
        .thinkingDots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .thinkingDots span:nth-child(3) {
          animation-delay: 0.6s;
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}