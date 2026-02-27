import React from "react";
import ProgressFooter from "./ProgressFooter";


export default function FormShell(props: {
  step: number;
  total: number;
  bannerImg?: string;
  stripColor?: string;
  children: React.ReactNode;
}) {
  const bannerImg = props.bannerImg ?? "/images/form-banner.png";
  const stripColor = props.stripColor ?? "var(--primary)";

  return (
    <div className="formShellWrapper">
      <div className="card formCard">
        {/* ===== Banner (Top image section) ===== */}
        <div
          className="formBanner"
          style={{
            backgroundImage: `url(${bannerImg})`,
          }}
        />

        {/* ===== Color strip (Google form style) ===== */}
        <div
          className="formHeaderStrip"
          style={{ background: stripColor }}
        />

        {/* ===== Content body ===== */}
        <div className="formBody vstack">
          {props.children}
        </div>

        {/* ===== Progress bar (always bottom) ===== */}
        <ProgressFooter step={props.step} total={props.total} />
      </div>

      
    </div>
  );
}
