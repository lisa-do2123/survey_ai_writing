// src/pages/AuthorshipPage.tsx
import { useMemo, useState } from "react";
import type { SurveyData } from "../types";

type SetDataLike = (
  updater: SurveyData | ((prev: SurveyData) => SurveyData)
) => void;

export default function AuthorshipPage(props: {
  data: SurveyData;
  setData: SetDataLike;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = useMemo(
    () => [
      "僅標示本人為唯一作者（不提及 AI 協助）",
      "標示本人為作者，並於備註／致謝中註記「使用生成式 AI 輔助」",
      "標示本人為主要作者，並於備註中較詳細說明 AI 的協作方式（但不列為作者姓名）",
      "標示本人與 AI 為共同創作者（並列作者）",
      "標示 AI 為主要創作者，本人為共同創作者（並列作者）",
      "標示 AI 為主要創作者，本人主要負責引導與編輯（並列作者）",
      "僅標示 AI 為作者（本人不列為作者）",
    ],
    []
  );

  const selected = props.data.authorship.value;
  const canNext = typeof selected === "number" && selected >= 1 && selected <= 7;

  const setChoice = (v: number) => {
    props.setData((d) => ({
      ...d,
      authorship: {
        ...d.authorship,
        value: v,
        choiceText: options[v - 1],
      },
    }));
  };

  const handleNext = async () => {
    if (!canNext || isSubmitting) return;

    const participantId = sessionStorage.getItem("participant_id");
    if (!participantId) {
      alert("找不到受試者編號，請重新開始。");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: participantId,
        authorship: selected,
        authorship_explanation: props.data.authorship.reason ?? "",
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
        throw new Error(text || "Update authorship failed");
      }

      props.onNext();
    } catch (err) {
      console.error("Authorship submit error:", err);
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
          className="pageTitle"
          style={{
            textAlign: "center",
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1.2,
            color: "var(--text)",
          }}
        >
          作者標示方式
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
        />
      </div>

      <div className="panel vstack">
        <div
          className="sectionTitle"
          style={{
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.7,
            color: "var(--text)",
          }}
        >
          若此作品未來將代表某品牌正式投稿，
          <br />
          並公開發佈於 <span className="hl">品牌官方平台</span> ，
          您會如何標示作者身份？
          <span style={{ marginLeft: 6, color: "var(--danger)" }}>*</span>
        </div>

        <div
          className="small"
          style={{
            marginTop: 8,
            fontSize: 18,
            lineHeight: 1.75,
            color: "var(--muted)",
          }}
        >
          「標示作者」指投稿時作者欄（署名）的呈現方式；
          「備註／致謝」則指作者欄以外的補充說明。
        </div>

        <div className="radioList" style={{ marginTop: 14 }}>
          {options.map((t, idx) => {
            const v = idx + 1;
            const checked = selected === v;

            return (
              <label
                key={v}
                className="radioRow"
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: checked
                    ? "rgba(109,46,112,0.06)"
                    : "transparent",
                  border: checked
                    ? "1px solid rgba(109,46,112,0.28)"
                    : "1px solid rgba(15,23,42,0.08)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "all 120ms ease",
                }}
              >
                <input
                  type="radio"
                  name="authorship"
                  disabled={isSubmitting}
                  checked={checked}
                  onChange={() => setChoice(v)}
                />

                <span
                  style={{
                    lineHeight: 1.7,
                    fontSize: 16,
                    color: "var(--text)",
                  }}
                >
                  <b style={{ marginRight: 8 }}>{v}.</b>
                  {t}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="panel vstack">
        <div
          className="sectionTitle"
          style={{
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.6,
            color: "var(--text)",
          }}
        >
          請簡述您做出此選擇的原因或考量（可選）
        </div>

        <textarea
          value={props.data.authorship.reason ?? ""}
          disabled={isSubmitting}
          onChange={(e) =>
            props.setData((d) => ({
              ...d,
              authorship: {
                ...d.authorship,
                reason: e.target.value,
              },
            }))
          }
          placeholder="簡要說明即可（1–2 句）"
          style={{
            minHeight: 140,
            marginTop: 10,
            borderRadius: 14,
            border: "1px solid #ddd",
            padding: 14,
            lineHeight: 1.8,
            fontSize: 15,
            outline: "none",
            resize: "vertical",
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
          disabled={!canNext || isSubmitting}
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

      {!canNext && !isSubmitting && (
        <div
          className="small"
          style={{
            color: "var(--danger)",
            fontWeight: 900,
            fontSize: 14,
            lineHeight: 1.7,
            marginTop: -2,
          }}
        >
          請先選擇一項作答後再繼續。
        </div>
      )}
    </div>
  );
}