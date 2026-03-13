// src/pages/DemographicsPage.tsx
import { useState } from "react";
import type { SurveyData } from "../types";
import { zh } from "../surveyContentZh";

type SetDataLike = (
  updater: SurveyData | ((prev: SurveyData) => SurveyData)
) => void;

export default function DemographicsPage(props: {
  data: SurveyData;
  setData: SetDataLike;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const d = props.data.demo;

  const hasValidEmail = Boolean(d.email && d.email.includes("@"));

  const canNext =
    Boolean(d.age && d.gender && d.edu) &&
    hasValidEmail &&
    (d.contactOptIn === true || d.contactOptIn === false);

  const setDemo = (patch: Partial<typeof d>) => {
    props.setData((s) => ({
      ...s,
      demo: { ...s.demo, ...patch },
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
        age: d.age,
        gender: d.gender,
        education: d.edu,
        email_contact: d.email,
        contact_consent: d.contactOptIn,
        open_ended_feedback: d.openEnded ?? "",
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
        throw new Error(text || "Update demographics failed");
      }

      props.onNext();
    } catch (err) {
      console.error("Demo submit error:", err);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredMark = (
    <span style={{ color: "#dc2626", fontWeight: 900, marginLeft: 6 }}>
      *
    </span>
  );

  const optionCardStyle = (checked: boolean) =>
    ({
      padding: "12px 14px",
      borderRadius: 12,
      border: checked
        ? "1px solid rgba(109,46,112,0.28)"
        : "1px solid rgba(15,23,42,0.08)",
      background: checked ? "rgba(109,46,112,0.06)" : "#fff",
      transition: "all 120ms ease",
      cursor: isSubmitting ? "not-allowed" : "pointer",
    }) as const;

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
          {zh.demo.title}
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

      {/* 年齡 */}
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
          {zh.demo.age}
          {requiredMark}
        </div>

        <div className="radioList" style={{ marginTop: 8 }}>
          {zh.demo.ageOptions.map((o) => {
            const checked = d.age === o;

            return (
              <label
                key={o}
                className="radioRow"
                style={optionCardStyle(checked)}
              >
                <input
                  type="radio"
                  name="age"
                  disabled={isSubmitting}
                  checked={checked}
                  onChange={() => setDemo({ age: o })}
                />

                <span style={{ fontSize: 16, lineHeight: 1.7 }}>{o}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 性別 */}
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
          {zh.demo.gender}
          {requiredMark}
        </div>

        <div className="radioList" style={{ marginTop: 8 }}>
          {zh.demo.genderOptions.map((o) => {
            const checked = d.gender === o;

            return (
              <label
                key={o}
                className="radioRow"
                style={optionCardStyle(checked)}
              >
                <input
                  type="radio"
                  name="gender"
                  disabled={isSubmitting}
                  checked={checked}
                  onChange={() => setDemo({ gender: o })}
                />

                <span style={{ fontSize: 16, lineHeight: 1.7 }}>{o}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 教育程度 */}
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
          {zh.demo.edu}
          {requiredMark}
        </div>

        <div className="radioList" style={{ marginTop: 8 }}>
          {zh.demo.eduOptions.map((o) => {
            const checked = d.edu === o;

            return (
              <label
                key={o}
                className="radioRow"
                style={optionCardStyle(checked)}
              >
                <input
                  type="radio"
                  name="edu"
                  disabled={isSubmitting}
                  checked={checked}
                  onChange={() => setDemo({ edu: o })}
                />

                <span style={{ fontSize: 16, lineHeight: 1.7 }}>{o}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Email */}
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
          電子郵件
          {requiredMark}
        </div>

        <div
          className="small"
          style={{
            marginTop: 6,
            fontSize: 14,
            lineHeight: 1.75,
            color: "var(--muted)",
          }}
        >
          我們僅於您中獎或符合領獎資格時，透過電子郵件通知領獎事宜。
        </div>

        <input
          type="text"
          disabled={isSubmitting}
          value={d.email ?? ""}
          onChange={(e) => setDemo({ email: e.target.value })}
          placeholder="name@example.com"
          style={{
            maxWidth: 420,
            marginTop: 10,
            height: 46,
            borderRadius: 12,
            border: "1px solid #ddd",
            padding: "0 14px",
            fontSize: 15,
            outline: "none",
          }}
        />
      </div>

      {/* 後續聯繫 */}
      <div className="panel vstack">
        <div
          className="sectionTitle"
          style={{
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.65,
            color: "var(--text)",
          }}
        >
          若未來需進行後續研究，您是否同意透過 Email 聯繫？
          {requiredMark}
        </div>

        <div className="radioList" style={{ marginTop: 8 }}>
          {[
            { label: "同意，我願意參與後續研究", value: true },
            { label: "不同意", value: false },
          ].map((opt) => {
            const checked = d.contactOptIn === opt.value;

            return (
              <label
                key={String(opt.value)}
                className="radioRow"
                style={optionCardStyle(checked)}
              >
                <input
                  type="radio"
                  name="contact"
                  disabled={isSubmitting}
                  checked={checked}
                  onChange={() => setDemo({ contactOptIn: opt.value })}
                />

                <span style={{ fontSize: 16, lineHeight: 1.7 }}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 開放式問題 */}
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
          {zh.demo.openEnded}
        </div>

        <textarea
          disabled={isSubmitting}
          value={d.openEnded ?? ""}
          onChange={(e) => setDemo({ openEnded: e.target.value })}
          placeholder="（可選）"
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
          {isSubmitting ? "儲存中..." : "完成問卷"}
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
          請完成所有必填欄位。
        </div>
      )}
    </div>
  );
}