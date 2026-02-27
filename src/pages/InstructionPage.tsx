// src/pages/InstructionPage.tsx
import { useMemo, useState } from "react";
import { zh } from "../surveyContentZh";

/**
 * InstructionPage (single-column, Google-Forms-like)
 * - Title centered
 * - Consistent section numbering: 一、二、三、四
 * - Buttons: 上一步 (left) / 我已了解 — 開始寫作 (right)
 */
export default function InstructionPage(props: {
  onPrev?: () => void;
  onNext: () => void;
}) {
  const [ans, setAns] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false); // ✅ Chi tiết tối ưu: Tránh double-click
  
  const correct = ans === zh.instruction.correctIndex;

  const scenarioLines = useMemo(
    () => [
      "您將創作一則故事型廣告，用來推廣一項產品，您的作品將進入創意內容競賽。",
      "內容評審最佳之前三名作品，將各獲得額外獎金 1000 元等值的7-11禮券。",
    ],
    []
  );

  const goPrev = () => {
    if (isMoving) return;
    if (props.onPrev) props.onPrev();
    else window.history.back();
  };

  const handleNext = () => {
    if (!correct || isMoving) return;
    setIsMoving(true); // ✅ Đánh dấu đang chuyển trang
    props.onNext();
  };

  return (
    <div className="vstack">
      <div className="card vstack">
        {/* Page title */}
        <div className="panel">
          <div className="pageTitle" style={{ textAlign: "center" }}>
            任務說明
          </div>
        </div>

        {/* 一、情境與評分標準 */}
        <div className="panel vstack">
          <div className="sectionHead">
            <div className="sectionTitleZh">一、情境與評分標準</div>
          </div>

          <ul style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.85 }}>
            {scenarioLines.map((t, i) => (
              <li key={i}>
                {t.includes("5 句以上") ? (
                  <span>
                    {t.replace("5 句以上", "")}
                    <span className="hl">5 句以上</span>*
                  </span>
                ) : (
                  t
                )}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 12 }}>
            <div className="small" style={{ fontWeight: 800, color: "#334155" }}>
              評分標準：
            </div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.85 }}>
              {zh.instruction.criteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--danger)", fontWeight: 900 }}>*</span> 為必填要求
          </div>
        </div>

        {/* 二、範例 */}
        <div className="panel vstack">
          <div className="sectionHead">
            <div className="sectionTitleZh">二、範例</div>
          </div>

          <div
            style={{
              marginTop: 10,
              background: "#f8fafc",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div className="exampleGrid">
              <div className="exampleMedia">
                <img
                  src="/images/wallet.png"
                  alt="Smart Wallet example"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.10)",
                    boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
                  }}
                />
              </div>

              <div className="exampleText vstack">
                <div className="small" style={{ fontWeight: 900, color: "#0f172a" }}>
                  {zh.instruction.exampleTitle}
                </div>

                <div className="small" style={{ whiteSpace: "pre-line", color: "#334155" }}>
                  {zh.instruction.exampleProduct}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(15,23,42,0.06)",
                    whiteSpace: "pre-line",
                    lineHeight: 1.75,
                  }}
                >
                  {zh.instruction.exampleStory}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 三、你的任務 */}
        <div className="panel vstack">
          <div className="sectionHead">
            <div className="sectionTitleZh">三、你的任務</div>
          </div>

          <div style={{ marginTop: 10, lineHeight: 1.9 }}>
            <div>
              請撰寫一篇「<b>故事型廣告</b>」（Story-based Advertisement），推廣以下產品：
            </div>

            <div style={{ marginTop: 10 }} className="taskMeta">
              <div className="taskMetaRow">
                <span className="taskMetaLabel">產品：</span>
                <span className="taskMetaValue">SmartBottle</span>
              </div>
              <div className="taskMetaRow">
                <span className="taskMetaLabel">核心功能：</span>
                <span className="taskMetaValue">震動提醒使用者補充水分</span>
              </div>
              <div className="taskMetaRow">
                <span className="taskMetaLabel">句數要求：</span>
                <span className="taskMetaValue">至少 5 句以上</span>
                <span style={{ color: "var(--danger)", fontWeight: 900 }}> *</span>
              </div>
            </div>

            <div className="small" style={{ marginTop: 10, color: "#475569" }}>
              下一頁將進入寫作頁面，您可使用下方提供的 AI 對話框協助完成任務（可自由使用）。
            </div>
          </div>
        </div>

        {/* 四、理解測驗 */}
        <div className="panel vstack">
          <div className="sectionHead">
            <div className="sectionTitleZh">四、理解測驗</div>
          </div>

          <div className="small" style={{ marginTop: 8, fontWeight: 900, color: "#0f172a" }}>
            {zh.instruction.checkQ} <span style={{ color: "var(--danger)" }}>*</span>
          </div>

          <div style={{ marginTop: 10 }} className="vstack">
            {zh.instruction.checkA.map((opt, i) => (
              <label key={i} className="hstack" style={{ gap: 10 }}>
                <input type="radio" name="cc" checked={ans === i} onChange={() => setAns(i)} disabled={isMoving} />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {ans !== null && !correct && (
            <div className="small" style={{ color: "var(--danger)", fontWeight: 800, marginTop: 8 }}>
              請再確認：本任務至少需達 5 句以上。
            </div>
          )}

          <div className="small" style={{ marginTop: 10, color: "#64748b" }}>
            ※ 請先完成理解測驗後，才能進入下一頁。
          </div>
        </div>

        {/* Buttons row */}
        <div className="panel btnRow" style={{ justifyContent: "space-between" }}>
          <button onClick={goPrev} disabled={isMoving}>上一步</button>

          <button 
            className="primary" 
            disabled={!correct || isMoving} 
            onClick={handleNext}
          >
            {isMoving ? "載入中..." : "我已了解 — 開始寫作"}
          </button>
        </div>
      </div>

      <style>{`
        .exampleGrid{ display:grid; grid-template-columns: 1fr; gap: 14px; align-items: start; }
        @media (min-width: 860px){ .exampleGrid{ grid-template-columns: 4fr 6fr; } }
        .taskMeta{ display:flex; flex-direction:column; gap: 6px; }
        .taskMetaRow{ display:flex; align-items:baseline; gap: 10px; flex-wrap: wrap; }
        .taskMetaLabel{ font-weight: 900; color: #0f172a; min-width: 92px; }
        .taskMetaValue{ font-weight: 900; color: var(--primary); }
      `}</style>
    </div>
  );
}