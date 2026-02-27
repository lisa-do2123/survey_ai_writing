// src/pages/BaselinePage.tsx
import React, { useMemo, useState } from "react";
import LikertBlock from "../components/LikertBlock";
import type { Likert, SurveyData } from "../types";
import { zh } from "../surveyContentZh";

export default function BaselinePage(props: {
  data: SurveyData;
  setLikert: (id: string, v: Likert) => void;
  baselineIds: string[];
  onNext: () => void;
}) {
  const [showMissing, setShowMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const missingIds = useMemo(
    () => props.baselineIds.filter((id) => typeof props.data.likert[id] !== "number"),
    [props.baselineIds, props.data.likert]
  );

  // ✅ HÀM CẬP NHẬT: Tự động cuộn đến câu chưa điền đầu tiên
  const handleNext = async () => {
    if (missingIds.length > 0) {
      setShowMissing(true);

      // Tìm ID của câu hỏi đầu tiên bị thiếu
      const firstMissingId = missingIds[0];
      const element = document.getElementById(`block-${firstMissingId}`); // ID này được tạo trong LikertBlock

      if (element) {
        // Cuộn mượt mà đến vị trí câu đó và căn vào giữa màn hình
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id) return;

    setIsSubmitting(true);
    try {
      // Chuẩn hóa key sang chữ thường trước khi gửi để khớp DB
      const lowercaseLikert: any = {};
      Object.keys(props.data.likert).forEach(key => {
        lowercaseLikert[key.toLowerCase()] = props.data.likert[key];
      });

      const payload = {
        id: participant_id,
        ...lowercaseLikert 
      };

      const res = await fetch("http://localhost:3001/api/survey/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update baseline failed");

      props.onNext();
    } catch (e) {
      console.error("Baseline submit error:", e);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vstack">
      <div className="card vstack">
        <div className="panel">
          <div className="pageTitle" style={{ textAlign: "center" }}>
            個人背景與觀點
          </div>
          <div className="small" style={{ textAlign: "center", marginTop: 6 }}>
            請根據您目前的想法與經驗作答（1 = 非常不同意，7 = 非常同意）
          </div>
          
          {/* ✅ CẬP NHẬT: Ẩn mã câu hỏi kỹ thuật (pau3...) */}
          {showMissing && missingIds.length > 0 && (
            <div className="missingBox" style={{ marginTop: 10, color: "var(--danger)", fontWeight: 900, textAlign: "center" }}>
              ⚠️ 尚有題目未完成，請檢查下方紅框標示的部分。
            </div>
          )}
        </div>

        {zh.baseline.blocks.map((b, idx) => (
          <LikertBlock
            key={idx}
            title={b.blockTitle}
            items={b.items}
            valueMap={props.data.likert as any}
            onChange={props.setLikert}
            anchors={zh.baseline.anchors}
            missingIds={showMissing ? missingIds : []}
          />
        ))}

        <div className="panel btnRow" style={{ justifyContent: "space-between" }}>
          <div className="small">（必填）請完成所有題項後才能繼續。</div>
          <button
            className="primary"
            disabled={isSubmitting}
            onClick={handleNext} 
          >
            {isSubmitting ? "儲存中..." : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}