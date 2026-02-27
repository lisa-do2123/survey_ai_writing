// src/pages/DebriefPage.tsx
import React, { useState } from "react";
import type { SurveyData } from "../types";

export default function DebriefPage(props: {
  data: SurveyData;
  onPrev?: () => void;
  onFinish: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (loading) return; // ✅ Tránh double-click cực nhanh
    try {
      setLoading(true);
      
      // ✅ props.onFinish này sẽ gọi tới API /api/participants/complete ở Backend
      // Để Server tự động tính toán total_duration_sec
      await props.onFinish();
      
    } catch (error) {
      console.error("Finish error:", error);
      alert("提交最後狀態時發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card vstack">
      <div className="pageTitle" style={{ textAlign: "center" }}>
        感謝參與與後續說明
      </div>

      <div className="panel vstack">
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 6 }}>
          🌟 任務已完成！
        </div>
        <div style={{ lineHeight: 1.7, fontSize: 16 }}>
          非常感謝您撥冗參與本次學術研究。<br />
          您的回饋對於研究資料的完整性與分析品質具有重要價值。
        </div>
      </div>

      <div className="panel vstack">
        <div className="sectionTitle">📧 聯繫資訊</div>
        <div style={{ lineHeight: 1.8, fontSize: 16 }}>
          若您對本研究流程有任何疑問，歡迎與研究團隊聯繫：
          <div style={{ marginTop: 8 }}>
            <div><b>主要研究者：</b>[姓名]</div>
            <div><b>所屬單位：</b>國立中央大學 [系所]</div>
            <div><b>聯絡信箱：</b>[Email]</div>
          </div>
        </div>
      </div>

      <div className="panel">
        {/* Đảm bảo đường dẫn ảnh /images/thankyou.png tồn tại trong thư mục public */}
        <img
          src="/images/thankyou.png"
          alt="Thank you"
          style={{
            width: "100%",
            maxWidth: 400,
            margin: "0 auto",
            borderRadius: 12,
            border: "1px solid rgba(15,23,42,0.08)",
            display: "block",
            opacity: 0.95,
          }}
        />
      </div>

      <div className="panel btnRow" style={{ justifyContent: "space-between" }}>
        {props.onPrev ? (
          <button onClick={props.onPrev} disabled={loading}>
            上一步
          </button>
        ) : (
          <span />
        )}

        <button
          className="primary"
          disabled={loading}
          onClick={handleFinish}
        >
          {loading ? "處理中..." : "完成"}
        </button>
      </div>
    </div>
  );
}