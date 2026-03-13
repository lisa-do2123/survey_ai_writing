// src/pages/ConsentPage.tsx
import { useState } from "react";
import { API_BASE } from "../utils";

function getConditionFromUrl(): "cond1" | "cond2" {
  const params = new URLSearchParams(window.location.search);
  const cond = params.get("cond");
  return cond === "cond2" ? "cond2" : "cond1";
}

export default function ConsentPage(props: { onNext: () => void }) {
  const [agree, setAgree] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAgree = async () => {
    if (!agree || isCreating) return;

    setIsCreating(true);
    try {
      const condition = getConditionFromUrl();

      const res = await fetch(`${API_BASE}/api/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition_code: condition }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to initialize participant");
      }

      const data = await res.json();

      const participantId: string | undefined =
        data?.participant_id ?? data?.id ?? data?.participantId;

      if (!participantId) {
        throw new Error(
          `No participant id returned. Response: ${JSON.stringify(data)}`
        );
      }

      sessionStorage.setItem("participant_id", participantId);
      sessionStorage.setItem("id", participantId);

      props.onNext();
    } catch (e) {
      console.error("Init error:", e);
      alert(
        "系統初始化失敗，請稍後再試。\n\n" +
          "若仍失敗，請重新整理頁面（或用無痕模式）再試一次。"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const bodyTextStyle = {
    fontSize: 16,
    lineHeight: 1.9,
    color: "var(--text)",
  } as const;

  const listStyle = {
    margin: "10px 0 0",
    paddingLeft: 22,
    lineHeight: 1.9,
    color: "var(--text)",
    fontSize: 16,
  } as const;

  const titleStyle = {
    fontSize: 21,
    fontWeight: 900,
    color: "var(--text)",
    lineHeight: 1.35,
  } as const;

  return (
    <div className="vstack">
      <div style={{ textAlign: "center", marginTop: 4, marginBottom: 4 }}>
        <div
          style={{
            fontSize: 35,
            fontWeight: 900,
            color: "var(--text)",
            letterSpacing: -0.2,
            lineHeight: 1.2,
          }}
        >
          研究說明與參與同意
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead" style={{ marginBottom: 8 }}>
          <div className="sectionTitleZh" style={titleStyle}>
            📘 一、研究目的
          </div>
        </div>
        <div className="sectionBodyZh" style={bodyTextStyle}>
          本研究由 <span className="hl">國立中央大學管理系</span> 進行，旨在了解人們在完成寫作任務時的使用經驗與主觀感受。研究結果將僅用於學術研究與統計分析，不作其他用途。
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead" style={{ marginBottom: 8 }}>
          <div className="sectionTitleZh" style={titleStyle}>
            🕒 二、研究流程
          </div>
        </div>
        <div className="sectionBodyZh" style={bodyTextStyle}>
          若您同意參與本研究，您將依序完成：
          <ul style={listStyle}>
            <li>前測問卷</li>
            <li>一項簡短寫作任務</li>
            <li>任務後問卷</li>
          </ul>
          <div style={{ marginTop: 10 }}>
            整體填答時間約為 <span className="hl">15 分鐘</span>。
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead" style={{ marginBottom: 8 }}>
          <div className="sectionTitleZh" style={titleStyle}>
            🎁 三、參與獎勵
          </div>
        </div>
        <ul style={listStyle}>
          <li>
            <b>完成本研究者：</b>可獲得 <span className="hl">100 元</span> 等值禮券
          </li>
          <li>
            <b>抽獎機會：</b>另將抽出 <span className="hl">3 名</span>，每名可獲得{" "}
            <span className="hl">1000 元</span>
          </li>
          <li>
            <b>創意獎勵：</b>作品評選前 <span className="hl">3 名</span>，每名另得{" "}
            <span className="hl">1000 元</span>
          </li>
        </ul>
      </div>

      <div className="panel">
        <div className="sectionHead" style={{ marginBottom: 8 }}>
          <div className="sectionTitleZh" style={titleStyle}>
            🔒 四、隱私與資料保護
          </div>
        </div>
        <div className="sectionBodyZh" style={bodyTextStyle}>
          <div>
            研究資料將以 <span className="hl">匿名方式</span> 進行統計分析，並
            <span className="hl">妥善保密</span>，僅供學術研究使用。
          </div>
          <div style={{ marginTop: 10 }}>
            若您需提供聯絡資訊以參與抽獎或領取獎勵，該資訊將與研究作答資料
            <span className="hl">分開保存</span>，不會用於個人身分辨識分析。
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead" style={{ marginBottom: 8 }}>
          <div className="sectionTitleZh" style={titleStyle}>
            ✉️ 五、聯絡方式
          </div>
        </div>
        <div className="sectionBodyZh" style={bodyTextStyle}>
          若您對本研究內容、參與方式或資料使用有任何疑問，歡迎與研究團隊聯繫：
          <div style={{ marginTop: 10 }}>
            電子郵件：thuydo0399@gmail.com
          </div>
        </div>
      </div>

      <div className="panel consentAction">
        <label
          className={`hstack consentCheck ${agree ? "isChecked" : ""}`}
          style={{ alignItems: "flex-start" }}
        >
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span
            style={{
              fontWeight: 900,
              color: "var(--text)",
              fontSize: 16,
              lineHeight: 1.75,
            }}
          >
            我已閱讀並了解上述說明，並同意參與本研究。
          </span>
        </label>

        <div
          className="btnRow"
          style={{
            justifyContent: "flex-end",
            marginTop: 18,
          }}
        >
          <button
            className="primary"
            disabled={!agree || isCreating}
            onClick={handleAgree}
            style={{
              minHeight: 48,
              minWidth: 132,
              fontSize: 16,
              fontWeight: 800,
              padding: "0 22px",
            }}
          >
            {isCreating ? "初始化中..." : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}