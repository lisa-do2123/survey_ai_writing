import { useEffect, useMemo, useState } from "react";
import FormShell from "./components/FormShell";

import ConsentPage from "./pages/ConsentPage";
import BaselinePage from "./pages/BaselinePage";
import InstructionPage from "./pages/InstructionPage";
import TaskPage from "./pages/TaskPage";
import TaskPageCond2 from "./pages/TaskPageCond2";
import PostGroupPageA from "./pages/PostGroupPageA";
import PostGroupPageB from "./pages/PostGroupPageB";
import AuthorshipPage from "./pages/AuthorshipPage";
import DemographicsPage from "./pages/DemographicsPage";
import DebriefPage from "./pages/DebriefPage";

import { zh } from "./surveyContentZh";
import type { Likert, SurveyData } from "./types";
import { API_BASE, now } from "./utils";

const TOTAL_STEPS = 9;

function scrollToTopSafe() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  } catch {
    window.scrollTo(0, 0);
  }

  const selectors = [".container", ".card", ".form-shell", "main", "#root"];

  selectors.forEach((selector) => {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) {
      el.scrollTop = 0;
    }
  });
}

function getConditionFromUrl(): "cond1" | "cond2" {
  const params = new URLSearchParams(window.location.search);
  const cond = params.get("cond");

  if (cond === "cond2") return "cond2";
  return "cond1";
}

function makeEmpty(): SurveyData {
  return {
    likert: {},
    writing: { storyText: "" },
    chat: {
      messages: [],
      stats: { promptCount: 0, totalPromptChars: 0, totalReplyChars: 0 },
    },
    telemetry: { events: [] },
    authorship: {},
    demo: {},
  };
}

export default function App() {
  const [step, setStep] = useState<number>(() => {
  const saved = sessionStorage.getItem("survey_step");
  return saved ? Number(saved) : 1;
});
  const condition = useMemo(() => getConditionFromUrl(), []);

  const [data, setData] = useState<SurveyData>(() => {
  const participant = sessionStorage.getItem("participant_id");
  const raw = sessionStorage.getItem("survey_data_v5");

  if (!participant) {
    sessionStorage.removeItem("survey_data_v5");
    return makeEmpty();
  }

  return raw ? (JSON.parse(raw) as SurveyData) : makeEmpty();
});

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
  scrollToTopSafe();

  setTimeout(() => {
    scrollToTopSafe();
  }, 0);
}, [step]);

  useEffect(() => {
    sessionStorage.setItem("survey_data_v5", JSON.stringify(data));
  }, [data]);
  useEffect(() => {
  sessionStorage.setItem("survey_step", String(step));
}, [step]);

  const ensureParticipant = async () => {
    const existing = sessionStorage.getItem("participant_id");
    if (existing) return existing;

    const r = await fetch(`${API_BASE}/api/participants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ condition_code: condition }),
    });

    const d = await r.json();

    if (!d?.participant_id) {
      throw new Error("No participant_id returned");
    }

    sessionStorage.setItem("participant_id", d.participant_id);
    return d.participant_id as string;
  };

  const syncToWideTable = async (payload: Record<string, any>) => {
    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id) return;

    const lowercasePayload: Record<string, any> = { id: participant_id };
    Object.keys(payload).forEach((key) => {
      lowercasePayload[key.toLowerCase()] = payload[key];
    });

    try {
      const res = await fetch(`${API_BASE}/api/survey/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lowercasePayload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "syncToWideTable failed");
      }
    } catch (e) {
      console.error("Sync failed:", e);
    }
  };

  const log = (type: string, meta?: any) => {
    setData((d) => ({
      ...d,
      telemetry: { events: [...d.telemetry.events, { type, ts: now(), meta }] },
    }));
  };

  const setLikert = (id: string, v: Likert) => {
    setData((d) => ({ ...d, likert: { ...d.likert, [id]: v } }));
    syncToWideTable({ [id]: v });
  };

  const setDataAndAutosave = (
    updater: SurveyData | ((prev: SurveyData) => SurveyData)
  ) => {
    setData((prev) => {
      const next =
        typeof updater === "function" ? (updater as any)(prev) : updater;

      if (next.writing?.storyText !== prev.writing?.storyText) {
        syncToWideTable({ submitted_ad_text: next.writing.storyText });
      }

      if (next.authorship !== prev.authorship) {
        const payload: Record<string, any> = {};

        if (typeof next.authorship?.value === "number") {
          payload.authorship = next.authorship.value;
        }

        if (typeof next.authorship?.reason === "string") {
          payload.authorship_explanation = next.authorship.reason;
        }

        if (Object.keys(payload).length > 0) {
          syncToWideTable(payload);
        }
      }

      if (next.demo !== prev.demo) {
        syncToWideTable(next.demo as Record<string, any>);
      }

      return next;
    });
  };

  const baselineIds = useMemo(
    () => zh.baseline.blocks.flatMap((b) => b.items.map((i) => i.id)),
    []
  );

  return (
    <div className="container">
      <FormShell step={step} total={TOTAL_STEPS}>
        {step === 1 && (
          <ConsentPage
            onNext={async () => {
              log("consent_accept", { condition });
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <BaselinePage
            data={data}
            setLikert={setLikert}
            baselineIds={baselineIds}
            onNext={() => {
              log("baseline_done", { condition });
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <InstructionPage
            onPrev={() => setStep(2)}
            onNext={() => {
              log("instruction_done", { condition });
              setStep(4);
            }}
          />
        )}

        {step === 4 &&
          (condition === "cond2" ? (
            <TaskPageCond2
              data={data}
              setData={setDataAndAutosave}
              log={log}
              onPrev={() => setStep(3)}
              onNext={() => {
                log("task_submitted", { condition });
                setStep(5);
              }}
            />
          ) : (
            <TaskPage
              data={data}
              setData={setDataAndAutosave}
              log={log}
              onPrev={() => setStep(3)}
              onNext={() => {
                log("task_submitted", { condition });
                setStep(5);
              }}
            />
          ))}

        {step === 5 && (
          <PostGroupPageA
            data={data}
            setLikert={setLikert}
            onPrev={() => setStep(4)}
            onNext={() => setStep(6)}
          />
        )}

        {step === 6 && (
          <PostGroupPageB
            data={data}
            setLikert={setLikert}
            onPrev={() => setStep(5)}
            onNext={() => setStep(7)}
          />
        )}

        {step === 7 && (
          <AuthorshipPage
            data={data}
            setData={setDataAndAutosave}
            onPrev={() => setStep(6)}
            onNext={() => setStep(8)}
          />
        )}

        {step === 8 && (
          <DemographicsPage
            data={data}
            setData={setDataAndAutosave}
            onPrev={() => setStep(7)}
            onNext={() => {
              log("demographics_done", { condition });
              setStep(9);
            }}
          />
        )}

        {step === 9 && (
          <DebriefPage
            data={data}
            onPrev={() => setStep(8)}
            onFinish={async () => {
              log("finish", { condition });

              const participant_id = sessionStorage.getItem("participant_id");
              if (participant_id) {
                try {
                  const res = await fetch(`${API_BASE}/api/survey/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: participant_id,
                      finished_at: new Date().toISOString(),
                      status: "completed",
                    }),
                  });

                  const text = await res.text().catch(() => "");
                  if (!res.ok) {
                    throw new Error(text || "Failed to complete survey");
                  }
                } catch (e) {
                  console.error("complete failed:", e);
                  alert("提交最後狀態時發生錯誤，請稍後再試");
                  return;
                }
              }

              sessionStorage.removeItem("participant_id");
              sessionStorage.removeItem("survey_data_v5");
              sessionStorage.removeItem("survey_step");
              setData(makeEmpty());
              setStep(1);

              alert("已完成，感謝參與！");
            }}
          />
        )}
      </FormShell>
    </div>
  );
}