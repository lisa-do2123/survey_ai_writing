// src/pages/InstructionPage.tsx
import { useState } from "react";
import { zh } from "../surveyContentZh";

/**
 * InstructionPage
 * - Single-column, Google-Forms-like
 * - Title centered
 * - Consistent section numbering: 一、二、三、四
 * - Buttons: 上一步 (left) / 開始寫作 (right)
 */
export default function InstructionPage(props: {
  onPrev?: () => void;
  onNext: () => void;
}) {
  const [ans, setAns] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const instruction = zh.instruction;
  const scenario = instruction.sections.scenario;
  const example = instruction.sections.example;
  const task = instruction.sections.task;
  const comprehension = instruction.sections.comprehension;

  const correct = ans === 0;

  const goPrev = () => {
    if (isMoving) return;
    if (props.onPrev) props.onPrev();
    else window.history.back();
  };

  const handleNext = () => {
    if (!correct || isMoving) return;
    setIsMoving(true);
    props.onNext();
  };

  return (
    <div className="vstack">
      <div className="card vstack">
        {/* Page title */}
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
            {instruction.pageTitle}
          </div>
        </div>

        {/* 一、情境與評分標準 */}
        <div className="panel vstack" style={{ gap: 0 }}>
          <div className="sectionHead" style={{ marginBottom: 8 }}>
            <div
              className="sectionTitleZh"
              style={{
                fontSize: 21,
                fontWeight: 900,
                color: "var(--text)",
                lineHeight: 1.35,
              }}
            >
              {scenario.title}
            </div>
          </div>

          <ul
            style={{
              margin: "6px 0 0",
              paddingLeft: 20,
              lineHeight: 1.9,
              fontSize: 16,
              color: "var(--text)",
            }}
          >
            {scenario.lines.map((t, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {t}
              </li>
            ))}
          </ul>

          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(15,23,42,0.025)",
              border: "1px solid rgba(15,23,42,0.05)",
            }}
          >
            <div
              className="small"
              style={{
                fontWeight: 900,
                color: "#000000ff",
                fontSize: 17,
                lineHeight: 1.7,
              }}
            >
              {scenario.criteriaTitle}
            </div>

            <ul
              style={{
                margin: "8px 0 0",
                paddingLeft: 20,
                lineHeight: 1.9,
                fontSize: 16,
                color: "var(--text)",
              }}
            >
              {scenario.criteria.map((c, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {!!scenario.footnote && (
            <div
              className="small"
              style={{
                marginTop: 12,
                fontSize: 13,
                lineHeight: 1.7,
                color: "#64748b",
              }}
            >
              {scenario.footnote}
            </div>
          )}
        </div>

        {/* 二、範例 */}
        <div className="panel vstack" style={{ gap: 0 }}>
          <div className="sectionHead" style={{ marginBottom: 8 }}>
            <div
              className="sectionTitleZh"
              style={{
                fontSize: 21,
                fontWeight: 900,
                color: "var(--text)",
                lineHeight: 1.35,
              }}
            >
              {example.title}
            </div>
          </div>

          <div
            className="small"
            style={{
              marginTop: 4,
              fontSize: 14,
              lineHeight: 1.8,
              color: "#475569",
            }}
          >
            {example.intro}
          </div>

          <div
            style={{
              marginTop: 10,
              background: "#f8fafc",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div className="exampleGrid">
              <div className="exampleMedia">
                <img
                  src={example.imageSrc}
                  alt={example.imageAlt}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.10)",
                    boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
                  }}
                />
              </div>

              <div className="exampleText vstack" style={{ gap: 10 }}>
                <div
                  className="small"
                  style={{
                    fontWeight: 900,
                    color: "#0f172a",
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                >
                  {example.exampleTitle}
                </div>

                <div
                  className="small"
                  style={{
                    whiteSpace: "pre-line",
                    color: "#334155",
                    fontSize: 14,
                    lineHeight: 1.8,
                  }}
                >
                  {example.exampleProduct}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    padding: 14,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(15,23,42,0.06)",
                    whiteSpace: "pre-line",
                    lineHeight: 1.9,
                    fontSize: 15,
                    color: "var(--text)",
                  }}
                >
                  {example.exampleStory}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 三、你的任務 */}
        <div
          className="panel vstack"
          style={{
            gap: 0,
            border: "1px solid rgba(124,58,237,0.12)",
            boxShadow: "0 10px 24px rgba(124,58,237,0.04)",
          }}
        >
          <div className="sectionHead" style={{ marginBottom: 8 }}>
            <div
              className="sectionTitleZh"
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "var(--text)",
                lineHeight: 1.35,
              }}
            >
              {task.title}
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              lineHeight: 1.9,
              fontSize: 16,
              color: "var(--text)",
            }}
          >
            <div>
              {task.intro.replace("故事型廣告", "").trim()}
              <span className="hl">
                <b>故事型廣告</b>
              </span>
              ，推廣以下產品：
            </div>

            <div
              className="taskMeta"
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(124,58,237,0.04)",
                border: "1px solid rgba(124,58,237,0.08)",
              }}
            >
              <div className="taskMetaRow">
                <span className="taskMetaLabel">{task.meta.productLabel}</span>
                <span className="taskMetaValue">{task.meta.productValue}</span>
              </div>

              <div className="taskMetaRow">
                <span className="taskMetaLabel">
                  {task.meta.coreFunctionLabel}
                </span>
                <span className="taskMetaValue">
                  {task.meta.coreFunctionValue}
                </span>
              </div>

              <div className="taskMetaRow">
                <span className="taskMetaLabel">
                  {task.meta.minSentencesLabel}
                </span>
                <span className="taskMetaValue">
                  {task.meta.minSentencesValue}
                </span>
              </div>
            </div>

            <div
              className="large"
              style={{
                marginTop: 12,
                color: "#000000ff",
                fontSize: 16,
                lineHeight: 1.8,
              }}
            >
              <span style={{ color: "var(--danger)", fontWeight: 900 }}>
                ※ 提醒：
              </span>{" "}
              {task.note}
            </div>
          </div>
        </div>

        {/* 四、理解測驗 */}
        <div className="panel vstack" style={{ gap: 0 }}>
          <div className="sectionHead" style={{ marginBottom: 8 }}>
            <div
              className="sectionTitleZh"
              style={{
                fontSize: 21,
                fontWeight: 900,
                color: "var(--text)",
                lineHeight: 1.35,
              }}
            >
              {comprehension.title}
            </div>
          </div>

          <div
            className="small"
            style={{
              marginTop: 8,
              fontWeight: 900,
              color: "#0f172a",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            {comprehension.question}{" "}
            <span style={{ color: "var(--danger)" }}>*</span>
          </div>

          <div style={{ marginTop: 14 }} className="vstack">
            {comprehension.options.map((opt, i) => (
              <label
                key={i}
                className="hstack"
                style={{
                  gap: 10,
                  padding: "4px 0",
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "var(--text)",
                }}
              >
                <input
                  type="radio"
                  name="cc"
                  checked={ans === i}
                  onChange={() => setAns(i)}
                  disabled={isMoving}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {ans !== null && !correct && (
            <div
              className="small"
              style={{
                color: "var(--danger)",
                fontWeight: 800,
                marginTop: 10,
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {comprehension.errorMessage}
            </div>
          )}

          <div
            className="small"
            style={{
              marginTop: 12,
              color: "#64748b",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {comprehension.helperText}
          </div>
        </div>

        {/* Buttons row */}
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
          <button
            onClick={goPrev}
            disabled={isMoving}
            style={{
              minHeight: 48,
              minWidth: 132,
              fontSize: 16,
              fontWeight: 800,
              padding: "0 22px",
              flexShrink: 0,
            }}
          >
            {instruction.buttons.prev}
          </button>

          <button
            className="primary"
            disabled={!correct || isMoving}
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
            {isMoving ? instruction.buttons.loading : instruction.buttons.next}
          </button>
        </div>
      </div>

      <style>{`
        .exampleGrid{
          display:grid;
          grid-template-columns: 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (min-width: 860px){
          .exampleGrid{
            grid-template-columns: 4fr 6fr;
          }
        }
        .taskMeta{
          display:flex;
          flex-direction:column;
          gap: 8px;
        }
        .taskMetaRow{
          display:flex;
          align-items:baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .taskMetaLabel{
          font-weight: 900;
          color: #0f172a;
          min-width: 92px;
        }
        .taskMetaValue{
          font-weight: 900;
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}