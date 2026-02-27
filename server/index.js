// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const app = express();

// ---------- Guards ----------
if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL in server/.env");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in server/.env");
if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY in server/.env");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ---------- Middleware ----------
app.use(
  cors({
    // Cho phép localhost và tên miền thực tế của bạn sau khi deploy lên Vercel
    origin: ["http://localhost:5173", /\.vercel\.app$/], 
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" })); 

// ---------- Supabase ----------
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- API: Tạo Participant ----------
app.post("/api/participants", async (req, res) => {
  try {
    const id = randomUUID();
    const { error } = await supabase.from("survey_results").insert([{ id }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ participant_id: id });
  } catch (e) {
    console.error("participants error:", e);
    return res.status(500).json({ error: "participants_failed" });
  }
});

// ✅ CẬP NHẬT: Tự động chuyển Key sang chữ thường để khớp SQL
app.post("/api/survey/update", async (req, res) => {
  try {
    const { id, ...updateData } = req.body; 
    if (!id) return res.status(400).json({ error: "missing_id" });

    // Chuẩn hóa tất cả các key (như WSE1 -> wse1) trước khi gửi tới Supabase
    const lowercaseData = {};
    Object.keys(updateData).forEach(key => {
      lowercaseData[key.toLowerCase()] = updateData[key];
    });

    const { error } = await supabase
      .from("survey_results")
      .upsert({ id, ...lowercaseData }) 
      .eq("id", id);

    if (error) {
      console.error("Supabase Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (e) {
    console.error("survey update error:", e);
    return res.status(500).json({ error: "survey_update_failed" });
  }
});

app.post("/api/participants/complete", async (req, res) => {
  try {
    const { participant_id } = req.body;
    if (!participant_id) return res.status(400).json({ error: "missing_fields" });

    const now = new Date();

    const { data: participant, error: fetchError } = await supabase
      .from("survey_results")
      .select("created_at")
      .eq("id", participant_id)
      .single();

    if (fetchError || !participant) throw new Error("Participant not found");

    const startTime = new Date(participant.created_at);
    const durationSec = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const { error: updateError } = await supabase
      .from("survey_results")
      .update({ 
        completed_at: now.toISOString(),
        total_duration_sec: durationSec 
      })
      .eq("id", participant_id);

    if (updateError) return res.status(500).json({ error: updateError.message });
    return res.json({ success: true, duration: durationSec });
  } catch (e) {
    console.error("complete error:", e);
    return res.status(500).json({ error: "participants_complete_failed" });
  }
});

// ---------- API: Chat (gpt-4o-mini) ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "invalid_messages" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const chatContext = messages
      .filter(m => m?.content)
      .slice(-12)
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content) 
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
      return res.status(500).json({ error: "openai_failed", detail: errorDetail });
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content;

    return res.json({ reply: replyText ? replyText.trim() : "" });
  } catch (err) {
    return res.status(500).json({ error: "chat_failed" });
  }
});

app.post("/api/chatlog", async (req, res) => {
  try {
    const { participant_id, turn_index, role, content } = req.body;
    const { error } = await supabase
      .from("chat_logs")
      .insert([{ participant_id, turn_index, role, content }]);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "chatlog_failed" });
  }
});
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});
// ---------- Listen ----------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at port ${PORT}`);
  console.log(`🤖 Model: ${OPENAI_MODEL}`);
});