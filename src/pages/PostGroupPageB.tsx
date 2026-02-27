// src/pages/PostGroupPageB.tsx
import { useState } from "react";
import LikertBlock from "../components/LikertBlock";
import { zh } from "../surveyContentZh";
import type { Likert, SurveyData } from "../types";
import { API_BASE } from "../utils";

export default function PostGroupPageB(props: {
  data: SurveyData;
  setLikert: (id: string, v: Likert) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [showMissing, setShowMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const blocks = [zh.post.blocks[4], zh.post.blocks[5]];

  const allIds = blocks.flatMap((b) => b.items.map((it) => it.id));
  const missingIds = allIds.filter((id) => typeof props.data.likert[id] !== "number");

  const handleNext = async () => {
    if (missingIds.length > 0) {
      setShowMissing(true);
      
      const firstMissingId = missingIds[0];
      const element = document.getElementById(`block-${firstMissingId}`);
      
      if (element) {
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
      const lowercaseLikert: any = {};
      Object.keys(props.data.likert).forEach(key => {
        lowercaseLikert[key.toLowerCase()] = props.data.likert[key];
      });

      const payload = {
        id: participant_id,
        ...lowercaseLikert 
      };

      const res = await fetch(`${API_BASE}/api/survey/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update post-task B failed");

      props.onNext();
    } catch (e) {
      console.error("Post B submit error:", e);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card vstack">
      <div className="pageTitleCenter">任務後問卷（第 2 部分）</div>
      
      {showMissing && missingIds.length > 0 && (
        <div className="missingBox" style={{ marginTop: 10, color: "var(--danger)", fontWeight: 900, textAlign: "center" }}>
          ⚠️ 尚有題目未完成，請檢查紅框標示的部分。
        </div>
      )}

      {blocks.map((b, i) => (
        <LikertBlock
          key={i}
          title={b.blockTitle}
          items={b.items}
          valueMap={props.data.likert as any}
          onChange={props.setLikert}
          anchors={zh.post.anchors}
          missingIds={showMissing ? missingIds : []}
        />
      ))}

      <div className="panel btnRow" style={{ justifyContent: "space-between" }}>
        <button onClick={props.onPrev} disabled={isSubmitting}>上一步</button>
        <button
          className="primary"
          disabled={isSubmitting}
          onClick={handleNext} 
        >
          {isSubmitting ? "儲存中..." : "下一步"}
        </button>
      </div>
    </div>
  );
}