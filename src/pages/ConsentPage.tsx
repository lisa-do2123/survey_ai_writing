// src/pages/ConsentPage.tsx
import { useState } from "react";
import { API_BASE } from "../utils";

export default function ConsentPage(props: { onNext: () => void }) {
  const [agree, setAgree] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAgree = async () => {
    if (!agree || isCreating) return;

    setIsCreating(true);
    try {
      // 1) Create participant
      const res = await fetch(`${API_BASE}/api/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to initialize participant");
      }

      const data = await res.json();

      // ✅ accept both shapes: { participant_id } or { id }
      const participantId: string | undefined =
        data?.participant_id ?? data?.id ?? data?.participantId;

      if (!participantId) {
        throw new Error(`No participant id returned. Response: ${JSON.stringify(data)}`);
      }

      // 2) Save to sessionStorage (save BOTH keys to avoid mismatch across pages)
      sessionStorage.setItem("participant_id", participantId);
      sessionStorage.setItem("id", participantId);

      // 3) (Recommended) Save consent immediately so later pages don’t need to do it
      const payload = {
        id: participantId,
        consent: true,
        consent_at: new Date().toISOString(),
      };

      const res2 = await fetch(`${API_BASE}/api/survey/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res2.ok) {
        const j = await res2.json().catch(() => null);
        throw new Error(j?.error || "Failed to save consent");
      }

      // 4) Next
      props.onNext();
    } catch (e) {
      console.error("Init error:", e);
      alert(
        "系統初始化失敗，請稍後再試。\n\n" +
          "Tips: 若 Render 休眠，第一次可能需要等待 20–40 秒。\n" +
          "若仍失敗，請重新整理頁面（或用無痕模式）再試一次。"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="vstack">
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div
          style={{
            fontSize: 35,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: -0.2,
          }}
        >
          研究說明
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">📝 一、關於本研究</div>
        </div>
        <div className="sectionBodyZh">
          本研究旨在了解人們在進行寫作任務時，如何使用生成式 AI（例如 ChatGPT）作為協作工具，以及相關的寫作體驗與評估。研究結果僅用於學術分析。
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">🕒 二、時間</div>
        </div>
        <div className="sectionBodyZh">
          預計約需 <span className="hl">15 分鐘</span>（前測問卷 → 寫作任務（可自由使用 AI）→ 任務後問卷）。
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">🎁 三、報酬（獎勵）</div>
        </div>
        <ul
          style={{
            margin: "8px 0 0",
            paddingLeft: 18,
            lineHeight: 1.85,
            color: "var(--text)",
            fontSize: 16,
          }}
        >
          <li>
            <b>完成參與：</b>可獲得 <span className="hl">100 元</span> 等值禮券
          </li>
          <li>
            <b>抽獎機會：</b>將抽出 <span className="hl">3 名</span> 各 <span className="hl">1000 元</span>
          </li>
          <li>
            <b>創意獎勵：</b>作品評選前 <span className="hl">3 名</span>，每名另得 <span className="hl">1000 元</span>
          </li>
        </ul>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">🔒 四、隱私與資料保護</div>
        </div>
        <div className="sectionBodyZh">
          研究資料將以匿名形式進行統計分析，資料 <span className="hl">完全保密</span>，僅供學術用途。
        </div>
      </div>

      <div className="panel consentAction">
        <label className={`hstack consentCheck ${agree ? "isChecked" : ""}`}>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span style={{ fontWeight: 900, color: "var(--text)" }}>
            我已閱讀並同意參與本研究
          </span>
        </label>

        <div className="btnRow" style={{ justifyContent: "flex-end" }}>
          <button className="primary" disabled={!agree || isCreating} onClick={handleAgree}>
            {isCreating ? "初始化中..." : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}