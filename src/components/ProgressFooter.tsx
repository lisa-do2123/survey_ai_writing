import React from "react";

export default function ProgressFooter(props: {
  step: number;
  total: number;
  left?: React.ReactNode;  // 上一步
  right?: React.ReactNode; // 下一步
}) {
  const pct = Math.max(0, Math.min(100, (props.step / props.total) * 100));

  return (
    <div className="progressFooter">
      {/* Row 1: left/right buttons */}
      <div className="progressRowTop">
        <div className="progressLeft">{props.left}</div>
        <div className="progressRight">{props.right}</div>
      </div>

      {/* Row 2: centered progress + page text */}
      <div className="progressRowBottom">
        <div className="progressCenter">
          <div className="progressTrack" aria-label={`Progress ${Math.round(pct)}%`}>
            <div className="progressFill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progressPageText">第 {props.step} / {props.total} 頁</div>
        </div>
      </div>
    </div>
  );
}
