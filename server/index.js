import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { COND1_SINGLE_IDEA_SYSTEM_PROMPT } from "./prompt/cond1IdeaPrompt.js";
import { buildCond2Messages } from "./prompt/cond2StoryPrompt.js";

const app = express();

// ---------- Guards ----------
if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}
if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ---------- DB columns: must match survey_results ----------
const ALLOWED_COLUMNS = new Set([
  "id",
  "condition_code",
  "status",
  "started_at",
  "finished_at",
  "task_active_seconds_total",

  "age",
  "gender",
  "education",
  "email_contact",
  "contact_consent",

  "wse_1", "wse_2", "wse_3",
  "ceb_1", "ceb_2", "ceb_3",
  "mi_1", "mi_2", "mi_3",

  "pq_1", "pq_2", "pq_3", "pq_4",
  "paa_1", "paa_2", "paa_3", "paa_4", "paa_5",
  "ia_1", "ia_2", "ia_3", "ia_4",
  "pau_1", "pau_2", "pau_3",
  "pmd_1", "pmd_2", "pmd_3",
  "pct_1", "pct_2", "pct_3", "pct_4",

  "authorship",
  "authorship_explanation",
  "open_ended_feedback",

  "generate_count",
  "submitted_ad_text",
  "submitted_ad_word_count",
  "submitted_ad_sentence_count",

  "cond1_idea_1_text",
  "cond1_idea_2_text",
  "cond1_idea_3_text",
  "cond1_selected_idea_index",
  "cond1_selected_idea_text",

  "cond2_structure_form_1",
  "cond2_structure_form_2",
  "cond2_structure_form_3",
  "cond2_story_1_text",
  "cond2_story_2_text",
  "cond2_story_3_text",
  "cond2_selected_story_index",
  "cond2_selected_story_text",
]);

// ---------- Middleware ----------
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", /\.vercel\.app$/],
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

// ---------- Supabase ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------- Helpers ----------
function filterByAllowlist(updateData) {
  const filtered = {};

  for (const [key, val] of Object.entries(updateData || {})) {
    const lowerKey = String(key).toLowerCase();

    if (!ALLOWED_COLUMNS.has(lowerKey)) continue;
    if (typeof val === "undefined") continue;

    filtered[lowerKey] = val;
  }

  return filtered;
}

function buildChatMessages(messages) {
  return (messages || [])
    .filter((m) => m?.content)
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content),
    }));
}

function isValidCondition(conditionCode) {
  return conditionCode === "cond1" || conditionCode === "cond2";
}

async function callOpenAI(messages, { temperature = 0.7, max_tokens = 500 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(errorDetail || "openai_failed");
    }

    const data = await response.json();
    return String(data?.choices?.[0]?.message?.content ?? "").trim();
  } finally {
    clearTimeout(timeout);
  }
}

// ---------- API: Create Participant ----------
app.post("/api/participants", async (req, res) => {
  try {
    const { condition_code } = req.body || {};

if (!isValidCondition(condition_code)) {
  return res.status(400).json({ error: "invalid_condition_code" });
}

const id = randomUUID();

const row = {
  id,
  condition_code,
  status: "dropped",
  started_at: new Date().toISOString(),
};
    

    const { error } = await supabase.from("survey_results").insert([row]);

    if (error) {
      console.error("participants insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ participant_id: id });
  } catch (e) {
    console.error("participants error:", e);
    return res.status(500).json({ error: "participants_failed" });
  }
});

// ---------- API: Update Survey ----------
app.post("/api/survey/update", async (req, res) => {
  try {
    const { id, ...updateData } = req.body || {};
    if (!id) return res.status(400).json({ error: "missing_id" });

    const filteredData = filterByAllowlist(updateData);

    if (Object.keys(filteredData).length === 0) {
      return res.json({ success: true, message: "No valid columns to update" });
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("survey_results")
      .update(filteredData)
      .eq("id", id)
      .select("id, condition_code");

    if (updateError) {
      console.error("survey update error:", updateError.message);
      return res.status(500).json({ error: updateError.message });
    }

    if (!updatedRows || updatedRows.length === 0) {
  return res.status(404).json({ error: "participant_not_found" });
}

    return res.json({ success: true });
  } catch (e) {
    console.error("survey update fatal error:", e);
    return res.status(500).json({ error: "survey_update_failed" });
  }
});

// ---------- API: Mark Participant Complete ----------
app.post("/api/participants/complete", async (req, res) => {
  try {
    const { participant_id } = req.body || {};
    if (!participant_id) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("survey_results")
      .update({
        status: "completed",
        finished_at: nowIso,
      })
      .eq("id", participant_id);

    if (updateError) {
      console.error("complete update error:", updateError.message);
      return res.status(500).json({ error: updateError.message });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("complete error:", e);
    return res.status(500).json({ error: "participants_complete_failed" });
  }
});

// ---------- API: Cond1 Generate Idea ----------
app.post("/api/cond1/generate-idea", async (req, res) => {
  try {
    const messages = [
      {
        role: "system",
        content: COND1_SINGLE_IDEA_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: "請依格式提供 1 個故事型廣告創意方向。",
      },
    ];

    const reply = await callOpenAI(messages, {
      temperature: 0.9,
      max_tokens: 220,
    });

    return res.json({ idea: reply });
  } catch (err) {
    console.error("cond1 generate idea failed:", err);
    return res.status(500).json({
      error: "cond1_generate_failed",
      detail: String(err?.message || err),
    });
  }
});

// ---------- API: Cond2 Generate Story ----------
app.post("/api/cond2/generate-story", async (req, res) => {
  try {
    const { targetAudience, usageScenario, additionalRequirements } = req.body || {};

    if (!String(targetAudience || "").trim() || !String(usageScenario || "").trim()) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const messages = buildCond2Messages({
      targetAudience,
      usageScenario,
      additionalRequirements,
    });

    const reply = await callOpenAI(messages, {
      temperature: 0.8,
      max_tokens: 420,
    });

    return res.json({ story: reply });
  } catch (err) {
    console.error("cond2 generate story failed:", err);
    return res.status(500).json({
      error: "cond2_generate_failed",
      detail: String(err?.message || err),
    });
  }
});

// ---------- API: Generic Chat ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "invalid_messages" });
    }

    const chatContext = buildChatMessages(messages);
    const replyText = await callOpenAI(chatContext, {
      temperature: 0.7,
      max_tokens: 500,
    });

    return res.json({ reply: replyText });
  } catch (err) {
    console.error("chat_failed:", err);
    return res.status(500).json({
      error: "chat_failed",
      detail: String(err?.message || err),
    });
  }
});

// ---------- API: Chat log ----------
app.post("/api/chatlog", async (req, res) => {
  try {
    const { participant_id, turn_index, role, content } = req.body || {};
    if (!participant_id) {
      return res.status(400).json({ error: "missing_participant_id" });
    }

    const { error } = await supabase.from("chat_logs").insert([
      {
        participant_id,
        turn_index,
        role,
        content,
      },
    ]);

    if (error) {
      console.error("chatlog insert error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("chatlog_failed:", e);
    return res.status(500).json({ error: "chatlog_failed" });
  }
});

// ---------- Health Checks ----------
app.get("/", (req, res) => res.send("Backend is running ✅"));
app.get("/health", (req, res) => res.status(200).send("ok"));

// ---------- Server Start ----------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at port ${PORT}`);
  console.log(`🤖 Model: ${OPENAI_MODEL}`);
});