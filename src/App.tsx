// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import FormShell from "./components/FormShell";

import ConsentPage from "./pages/ConsentPage";
import BaselinePage from "./pages/BaselinePage";
import InstructionPage from "./pages/InstructionPage";
import TaskPage from "./pages/TaskPage";
import PostGroupPageA from "./pages/PostGroupPageA";
import PostGroupPageB from "./pages/PostGroupPageB";
import AuthorshipPage from "./pages/AuthorshipPage";
import DemographicsPage from "./pages/DemographicsPage";
import DebriefPage from "./pages/DebriefPage";

import { zh } from "./surveyContentZh";
import type { Likert, SurveyData } from "./types";
import { API_BASE, now } from "./utils";

const TOTAL_STEPS = 9;

// ✅ Robust scroll helper (works across iOS Safari / Android / Desktop)
function scrollToTopSafe() {
  // 1) window scroll
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  } catch {
    window.scrollTo(0, 0);
  }

  // 2) if your page uses a scroll container (just in case)
  const el = document.querySelector(".container");
  if (el && "scrollTop" in el) (el as HTMLElement).scrollTop = 0;
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
  const [step, setStep] = useState<number>(1);

  const [data, setData] = useState<SurveyData>(() => {
    const raw = sessionStorage.getItem("survey_data_v5");
    return raw ? (JSON.parse(raw) as SurveyData) : makeEmpty();
  });

  // ✅ Disable browser scroll restoration (prevents “stuck at bottom”)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // ✅ Always scroll to top when step changes (mobile/tablet/desktop)
  useEffect(() => {
    scrollToTopSafe();
  }, [step]);

  // --- Persist local session data ---
  useEffect(() => {
    sessionStorage.setItem("survey_data_v5", JSON.stringify(data));
  }, [data]);

  // ✅ Create participant id once (server inserts row into survey_results)
  const ensureParticipant = async () => {
    const existing = sessionStorage.getItem("participant_id");
    if (existing) return existing;

    const r = await fetch(`${API_BASE}/api/participants`, { method: "POST" });
    const d = await r.json();
    if (!d?.participant_id) throw new Error("No participant_id returned");
    sessionStorage.setItem("participant_id", d.participant_id);
    return d.participant_id as string;
  };

  // ✅ Sync wide table updates (lowercase keys for DB consistency)
  const syncToWideTable = async (payload: Record<string, any>) => {
    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id) return;

    const lowercasePayload: Record<string, any> = { id: participant_id };
    Object.keys(payload).forEach((key) => {
      lowercasePayload[key.toLowerCase()] = payload[key];
    });

    try {
      await fetch(`${API_BASE}/api/survey/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lowercasePayload),
      });
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

  // ✅ Likert update + immediate sync
  const setLikert = (id: string, v: Likert) => {
    setData((d) => ({ ...d, likert: { ...d.likert, [id]: v } }));
    syncToWideTable({ [id]: v });
  };

  // ✅ Big blocks update (writing/authorship/demo) + autosave
  const setDataAndAutosave = (updater: SurveyData | ((prev: SurveyData) => SurveyData)) => {
    setData((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;

      // Writing
      if (next.writing?.storyText !== prev.writing?.storyText) {
        syncToWideTable({ story_text: next.writing.storyText });
      }

      // Authorship (normalize to DB columns)
      if (next.authorship !== prev.authorship) {
        const payload: any = {};
        if (typeof next.authorship?.value === "number") payload.authorship_label = next.authorship.value;
        if (typeof next.authorship?.reason === "string") payload.authorship_reason = next.authorship.reason;
        if (Object.keys(payload).length) syncToWideTable(payload);
      }

      // Demo (send raw; server allowlist decides what is stored)
      if (next.demo !== prev.demo) {
        syncToWideTable(next.demo as any);
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
              log("consent_accept");
              await ensureParticipant();
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
              log("baseline_done");
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <InstructionPage
            onPrev={() => setStep(2)}
            onNext={() => {
              log("instruction_done");
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <TaskPage
            data={data}
            setData={setDataAndAutosave}
            log={log}
            onPrev={() => setStep(3)}
            onNext={() => {
              log("task_submitted");
              setStep(5);
            }}
          />
        )}

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
              log("demographics_done");
              setStep(9);
            }}
          />
        )}

        {step === 9 && (
          <DebriefPage
            data={data}
            onPrev={() => setStep(8)}
            onFinish={async () => {
              log("finish");

              const participant_id = sessionStorage.getItem("participant_id");
              if (participant_id) {
                try {
                  await fetch(`${API_BASE}/api/participants/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ participant_id }),
                  });
                } catch (e) {
                  console.error("complete failed:", e);
                }
              }

              sessionStorage.removeItem("participant_id");
              sessionStorage.removeItem("survey_data_v5");
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