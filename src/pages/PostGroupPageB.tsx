// src/pages/PostGroupPageB.tsx
import { useState } from "react";
import LikertBlock from "../components/LikertBlock";
import { zh } from "../surveyContentZh";
import type { Likert, SurveyData } from "../types";

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

  const missingIds = allIds.filter(
    (id) => typeof props.data.likert[id] !== "number"
  );

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

    const participantId = sessionStorage.getItem("participant_id");
    if (!participantId) {
      alert("找不到受試者編號，請重新開始。");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: participantId,
        ...Object.fromEntries(
          allIds.map((id) => [
            id.toLowerCase(),
            props.data.likert[id] ?? null,
          ])
        ),
      };

      const res = await fetch("/api/survey/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");

      if (!res.ok) {
        throw new Error(text || "Update post-task B failed");
      }

      props.onNext();
    } catch (err) {
      console.error("Post B submit error:", err);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
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
          className="pageTitleCenter"
          style={{
            textAlign: "center",
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1.2,
            color: "var(--text)",
          }}
        >
          任務後問卷 B
        </div>

        <div
          className="small"
          style={{
            textAlign: "center",
            marginTop: 10,
            fontSize: 14,
            lineHeight: 1.75,
            color: "var(--muted)",
          }}
        >
          請根據您剛剛完成任務時的想法與感受作答。
        </div>

        {showMissing && missingIds.length > 0 && (
          <div
            className="missingBox"
            style={{
              marginTop: 14,
              color: "var(--danger)",
              fontWeight: 900,
              textAlign: "center",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            ⚠️ 尚有題目未完成，請檢查紅框標示的部分。
          </div>
        )}
      </div>

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
        <button
          onClick={props.onPrev}
          disabled={isSubmitting}
          style={{
            minHeight: 42,
            padding: "0 18px",
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          上一步
        </button>

        <button
          className="primary"
          disabled={isSubmitting}
          onClick={handleNext}
          style={{
            minHeight: 48,
            minWidth: 132,
            fontSize: 16,
            fontWeight: 800,
            padding: "0 22px",
            flexShrink: 0,
          }}
        >
          {isSubmitting ? "儲存中..." : "下一步"}
        </button>
      </div>
    </div>
  );
}