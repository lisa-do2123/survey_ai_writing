// src/pages/DebriefPage.tsx
import { useState } from "react";
import type { SurveyData } from "../types";

export default function DebriefPage(props: {
  data: SurveyData;
  onPrev?: () => void;
  onFinish: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await props.onFinish();
    } catch (err) {
      console.error("Finish error:", err);
      alert("提交最後狀態時發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card vstack">
      <div
        className="panel"
        style={{
          paddingTop: 18,
          paddingBottom: 18,
          marginBottom: 2,
        }}
      >
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
          感謝參與與後續說明
        </div>
      </div>

      <div className="panel vstack">
        <div
          style={{
            fontWeight: 900,
            fontSize: 20,
            lineHeight: 1.4,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          🌟 任務已完成！
        </div>

        <div
          style={{
            lineHeight: 1.8,
            fontSize: 16,
            color: "var(--text)",
          }}
        >
          非常感謝您撥冗參與本次學術研究。<br />
          您的回饋對於研究資料的完整性與分析品質具有重要價值。
        </div>
      </div>

      <div className="panel vstack">
        <div
          className="sectionTitle"
          style={{
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1.6,
            color: "var(--text)",
          }}
        >
          📧 聯繫資訊
        </div>

        <div
          style={{
            marginTop: 8,
            lineHeight: 1.8,
            fontSize: 16,
            color: "var(--text)",
          }}
        >
          若您對本研究流程有任何疑問，歡迎與研究團隊聯繫：
          <div style={{ marginTop: 8 }}>
            <b>聯絡信箱：</b>thuydo0399@gmail.com
          </div>
        </div>
      </div>

      <div
        className="panel"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        <img
          src="/images/thankyou.png"
          alt="Thank you"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>

      <div
        className="panel btnRow"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          paddingTop: 16,
          paddingBottom: 16,
          marginTop: 2,
        }}
      >
        {props.onPrev ? (
          <button
            onClick={props.onPrev}
            disabled={loading}
            style={{
              minHeight: 42,
              padding: "0 18px",
              fontSize: 15,
            }}
          >
            上一步
          </button>
        ) : (
          <span />
        )}

        <button
          className="primary"
          disabled={loading}
          onClick={handleFinish}
          style={{
            minHeight: 48,
            minWidth: 132,
            fontSize: 16,
            fontWeight: 800,
            padding: "0 22px",
          }}
        >
          {loading ? "處理中..." : "完成"}
        </button>
      </div>
    </div>
  );
}