// src/pages/BaselinePage.tsx
import { useMemo, useState } from "react";
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
    if (!participant_id) {
      alert("找不到受試者編號，請重新開始。");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: participant_id,
        ...Object.fromEntries(
          props.baselineIds.map((id) => [id.toLowerCase(), props.data.likert[id]])
        ),
      };

      const res = await fetch("/api/survey/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        throw new Error(text || "Update baseline failed");
      }

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
        <div className="panel" style={{ paddingTop: 18, paddingBottom: 18 }}>
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
            個人背景與觀點
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
            請根據您目前的想法與經驗，選擇最符合您看法的答案。
            <br />
            （1 = 非常不同意，7 = 非常同意）
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

        <div
          className="panel btnRow"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <div
            className="small"
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--muted)",
            }}
          >
            請完成所有題項後才能繼續。
          </div>

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
    </div>
  );
}