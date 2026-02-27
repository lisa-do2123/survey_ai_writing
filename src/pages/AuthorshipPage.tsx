// src/pages/AuthorshipPage.tsx
import React, { useMemo, useState } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Quản lý trạng thái gửi

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

  // ✅ HÀM CẬP NHẬT: Gửi dữ liệu vào cột authorship_label và authorship_reason
  const handleNext = async () => {
    if (!canNext || isSubmitting) return;

    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id) return;

    setIsSubmitting(true);
    try {
      // ✅ Payload khớp 100% với tên cột trong Database
      const payload = {
        id: participant_id,
        authorship_label: selected, // Lưu số thứ tự 1-7
        authorship_reason: props.data.authorship.reason || "" // Lưu văn bản考量
      };

      const res = await fetch("http://localhost:3001/api/survey/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update authorship failed");

      props.onNext();
    } catch (e) {
      console.error("Authorship submit error:", e);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card vstack">
      <div className="pageTitle" style={{ textAlign: "center" }}>
        作者標示方式
      </div>

      <div className="panel vstack">
        <div className="sectionTitle" style={{ color: "var(--danger)", fontWeight: 900 }}>
          若此作品將正式投稿並公開參與競賽評選，您會如何標示作者身份？
          <span style={{ marginLeft: 6 }}>*</span>
        </div>

        <div className="small" style={{ marginTop: 6 }}>
          「標示作者」指投稿時作者欄（署名）之呈現方式；備註／致謝則為作者欄以外的說明。
        </div>

        <div className="radioList" style={{ marginTop: 10 }}>
          {options.map((t, idx) => {
            const v = idx + 1;
            const checked = selected === v;
            return (
              <label
                key={v}
                className="radioRow"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: checked ? "rgba(109,46,112,0.06)" : "transparent",
                  border: checked ? "1px solid rgba(109,46,112,0.28)" : "1px solid rgba(15,23,42,0.08)",
                  cursor: isSubmitting ? "not-allowed" : "pointer"
                }}
              >
                <input
                  type="radio"
                  name="authorship"
                  disabled={isSubmitting}
                  checked={checked}
                  onChange={() => setChoice(v)}
                />
                <span style={{ lineHeight: 1.55 }}>
                  <b style={{ marginRight: 8 }}>{v}.</b>
                  {t}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="panel vstack">
        <div className="sectionTitle">（可選）請簡述您做此選擇的主要考量</div>
        <textarea
          value={props.data.authorship.reason ?? ""}
          disabled={isSubmitting}
          onChange={(e) =>
            props.setData((d) => ({
              ...d,
              authorship: { ...d.authorship, reason: e.target.value },
            }))
          }
          placeholder="1–2 句即可"
          style={{ minHeight: 140 }}
        />
      </div>

      <div className="panel btnRow" style={{ justifyContent: "space-between" }}>
        <button onClick={props.onPrev} disabled={isSubmitting}>上一步</button>
        <button 
          className="primary" 
          disabled={!canNext || isSubmitting} 
          onClick={handleNext} // ✅ Gọi hàm handleNext để lưu vào DB
        >
          {isSubmitting ? "儲存中..." : "下一步"}
        </button>
      </div>

      {!canNext && !isSubmitting && (
        <div className="small" style={{ color: "var(--danger)", fontWeight: 800 }}>
          請先選擇一項作答後再繼續。
        </div>
      )}
    </div>
  );
}