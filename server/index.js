// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const app = express();

// ---------- Guards ----------
if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ✅ CẬP NHẬT: Danh sách cột khớp 100% với bảng survey_results của bạn
const ALLOWED_COLUMNS = new Set([
  // identity & timestamps
  "id",

  // task metrics
  "total_duration_sec",
  "task_page_elapsed_ms",
  "story_text",
  "sentence_count",
  "word_count",
  "ai_chat_log",

  // Nhóm WSE (Writing Self-Efficacy)
  "wse1", "wse2", "wse3",

  // Nhóm CEB (Cognitive Effort)
  "ceb1", "ceb2", "ceb3",

  // Nhóm PSP (Perceived Social Presence)
  "psp1", "psp2", "psp3", "psp4",

  // Nhóm MI (Mind Induction)
  "mi1", "mi2", "mi3",

  // Nhóm PQ (Perceived Quality)
  "pq1", "pq2", "pq3", "pq4",

  // Nhóm BAA (Behavioral AI Adoption)
  "baa1", "baa2", "baa3", "baa4", "baa5",

  // Nhóm IA (Interaction Quality)
  "ia1", "ia2", "ia3", "ia4",

  // Nhóm PAU (Perceived AI Usefulness)
  "pau1", "pau2", "pau3",

  // Nhóm PMD (Perceived Moral Dissonance)
  "pmd1", "pmd2", "pmd3",

  // Nhóm PCT (Perceived Control)
  "pct1", "pct2", "pct3", "pct4",

  // Authorship & Demographics
  "authorship_label",
  "authorship_reason",
  "age_group",
  "gender",
  "education_level",
  "email",
  "follow_up_consent",
  "additional_comments"
]);

// ---------- Middleware ----------
app.use(
  cors({
    origin: ["http://localhost:5173", /\.vercel\.app$/],
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

// ---------- Supabase ----------
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- Helpers ----------
function filterByAllowlist(updateData) {
  const filtered = {};
  for (const [key, val] of Object.entries(updateData || {})) {
    const lowerKey = String(key).toLowerCase();
    
    // Chỉ giữ lại các trường có trong danh sách ALLOWED_COLUMNS
    if (!ALLOWED_COLUMNS.has(lowerKey)) continue;
    if (typeof val === "undefined") continue;

    filtered[lowerKey] = val;
  }
  return filtered;
}

// ---------- API: Create Participant ----------
app.post("/api/participants", async (req, res) => {
  try {
    const id = randomUUID();
    const { error } = await supabase.from("survey_results").insert([{ id }]);
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

// ---------- API: Update Survey (Allowlist logic) ----------
app.post("/api/survey/update", async (req, res) => {
  try {
    const { id, ...updateData } = req.body || {};
    if (!id) return res.status(400).json({ error: "missing_id" });

    // Áp dụng màng lọc Allowlist
    const filteredData = filterByAllowlist(updateData);

    if (Object.keys(filteredData).length === 0) {
      return res.json({ success: true, message: "No valid columns to update" });
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("survey_results")
      .update(filteredData)
      .eq("id", id)
      .select("id"); 

    if (updateError) {
      console.error("survey update error:", updateError.message);
      return res.status(500).json({ error: updateError.message });
    }

    // Nếu ID chưa tồn tại, thực hiện insert dự phòng
    if (!updatedRows || updatedRows.length === 0) {
      const { error: insertError } = await supabase
        .from("survey_results")
        .insert([{ id, ...filteredData }]);

      if (insertError) {
        console.error("survey insert fallback error:", insertError.message);
        return res.status(500).json({ error: insertError.message });
      }
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
    if (!participant_id) return res.status(400).json({ error: "missing_fields" });

    const now = new Date();

    const { data: participant, error: fetchError } = await supabase
      .from("survey_results")
      .select("created_at")
      .eq("id", participant_id)
      .single();

    if (fetchError || !participant) {
      console.error("complete fetch error:", fetchError?.message);
      return res.status(404).json({ error: "participant_not_found" });
    }

    const startTime = new Date(participant.created_at);
    const durationSec = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const { error: updateError } = await supabase
      .from("survey_results")
      .update({
        completed_at: now.toISOString(),
        total_duration_sec: durationSec,
      })
      .eq("id", participant_id);

    if (updateError) return res.status(500).json({ error: updateError.message });
    return res.json({ success: true, duration: durationSec });
  } catch (e) {
    console.error("complete error:", e);
    return res.status(500).json({ error: "participants_complete_failed" });
  }
});

// ---------- API: Chat (GPT API) ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "invalid_messages" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const chatContext = messages
      .filter((m) => m?.content)
      .slice(-12)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content),
      }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: chatContext,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error("openai_failed:", errorDetail);
      return res.status(500).json({ error: "openai_failed", detail: errorDetail });
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content;

    return res.json({ reply: replyText ? String(replyText).trim() : "" });
  } catch (err) {
    console.error("chat_failed:", err);
    return res.status(500).json({ error: "chat_failed" });
  }
});

// ---------- API: Chat log ----------
app.post("/api/chatlog", async (req, res) => {
  try {
    const { participant_id, turn_index, role, content } = req.body || {};
    if (!participant_id) return res.status(400).json({ error: "missing_participant_id" });

    const { error } = await supabase.from("chat_logs").insert([
      { participant_id, turn_index, role, content },
    ]);

    if (error) return res.status(500).json({ error: error.message });
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