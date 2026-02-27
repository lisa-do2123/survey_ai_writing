// src/pages/DemographicsPage.tsx
import { useState } from "react";
import type { SurveyData } from "../types";
import { zh } from "../surveyContentZh";
import { API_BASE } from "../utils";

type SetDataLike = (
  updater: SurveyData | ((prev: SurveyData) => SurveyData)
) => void;

export default function DemographicsPage(props: {
  data: SurveyData;
  setData: SetDataLike;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Trạng thái gửi dữ liệu
  const d = props.data.demo;

  const hasValidEmail = Boolean(d.email && d.email.includes("@"));
  const canNext =
    Boolean(d.age && d.gender && d.edu) &&
    hasValidEmail &&
    (d.contactOptIn === true || d.contactOptIn === false);

  const setDemo = (patch: Partial<typeof d>) => {
    props.setData((s) => ({ ...s, demo: { ...s.demo, ...patch } }));
  };

  // ✅ HÀM MỚI: Đồng bộ dữ liệu nhân khẩu học vào bảng ngang
  const handleNext = async () => {
    if (!canNext || isSubmitting) return;

    const participant_id = sessionStorage.getItem("participant_id");
    if (!participant_id) return;

    setIsSubmitting(true);
    try {
      // Ánh xạ dữ liệu UI sang tên cột trong Database (viết thường)
      const payload = {
        id: participant_id,
        age_group: d.age,
        gender: d.gender,
        education_level: d.edu,
        email: d.email,
        follow_up_consent: d.contactOptIn,
        additional_comments: d.openEnded
      };

      const res = await fetch(`${API_BASE}/api/survey/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update demographics failed");

      props.onNext();
    } catch (e) {
      console.error("Demo submit error:", e);
      alert("提交失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card vstack">
      <div className="pageTitle" style={{ textAlign: "center" }}>
        {zh.demo.title}
      </div>

      {/* Tuổi */}
      <div className="panel vstack">
        <div className="sectionTitle">
          {zh.demo.age}
          <span style={{ color: "#dc2626", fontWeight: 900, marginLeft: 6 }}>*</span>
        </div>
        <div className="radioList">
          {zh.demo.ageOptions.map((o) => (
            <label key={o} className="radioRow">
              <input
                type="radio"
                name="age"
                disabled={isSubmitting}
                checked={d.age === o}
                onChange={() => setDemo({ age: o })}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Giới tính */}
      <div className="panel vstack">
        <div className="sectionTitle">
          {zh.demo.gender}
          <span style={{ color: "#dc2626", fontWeight: 900, marginLeft: 6 }}>*</span>
        </div>
        <div className="radioList">
          {zh.demo.genderOptions.map((o) => (
            <label key={o} className="radioRow">
              <input
                type="radio"
                name="gender"
                disabled={isSubmitting}
                checked={d.gender === o}
                onChange={() => setDemo({ gender: o })}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Giáo dục */}
      <div className="panel vstack">
        <div className="sectionTitle">
          {zh.demo.edu}
          <span style={{ color: "#dc2626", fontWeight: 900, marginLeft: 6 }}>*</span>
        </div>
        <div className="radioList">
          {zh.demo.eduOptions.map((o) => (
            <label key={o} className="radioRow">
              <input
                type="radio"
                name="edu"
                disabled={isSubmitting}
                checked={d.edu === o}
                onChange={() => setDemo({ edu: o })}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Email */}
      <div className="panel vstack">
        <div className="sectionTitle">
          電子郵件
          <span style={{ color: "#dc2626", fontWeight: 900, marginLeft: 6 }}>*</span>
        </div>
        <div className="small" style={{ opacity: 0.85, lineHeight: 1.5 }}>
          我們僅於您中獎或符合領獎資格時，透過電子郵件通知領獎事宜。
        </div>
        <input
          type="text"
          disabled={isSubmitting}
          value={d.email ?? ""}
          onChange={(e) => setDemo({ email: e.target.value })}
          placeholder="name@example.com"
          style={{ maxWidth: 420 }}
        />
      </div>

      {/* Đồng ý liên hệ */}
      <div className="panel vstack">
        <div className="sectionTitle" style={{ marginTop: 6 }}>
          若未來需進行後續研究，您是否同意透過 Email 聯繫？
          <span style={{ color: "#dc2626", fontWeight: 900, marginLeft: 6 }}>*</span>
        </div>
        <div className="radioList">
          <label className="radioRow">
            <input
              type="radio"
              name="contact"
              disabled={isSubmitting}
              checked={d.contactOptIn === true}
              onChange={() => setDemo({ contactOptIn: true })}
            />
            <span>同意，我願意參與後續研究</span>
          </label>
          <label className="radioRow">
            <input
              type="radio"
              name="contact"
              disabled={isSubmitting}
              checked={d.contactOptIn === false}
              onChange={() => setDemo({ contactOptIn: false })}
            />
            <span>不同意</span>
          </label>
        </div>
      </div>

      {/* Góp ý thêm */}
      <div className="panel vstack">
        <div className="sectionTitle">{zh.demo.openEnded}</div>
        <textarea
          disabled={isSubmitting}
          value={d.openEnded ?? ""}
          onChange={(e) => setDemo({ openEnded: e.target.value })}
          placeholder="（可選）"
          style={{ minHeight: 140 }}
        />
      </div>

      {/* Điều hướng */}
      <div className="panel btnRow" style={{ justifyContent: "space-between" }}>
        <button onClick={props.onPrev} disabled={isSubmitting}>上一步</button>
        <button 
          className="primary" 
          disabled={!canNext || isSubmitting} 
          onClick={handleNext}
        >
          {isSubmitting ? "儲存中..." : "下一步"}
        </button>
      </div>

      {!canNext && !isSubmitting && (
        <div className="small" style={{ color: "var(--danger)", fontWeight: 800 }}>
          請完成所有必填欄位。
        </div>
      )}
    </div>
  );
}