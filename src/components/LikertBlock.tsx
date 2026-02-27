// src/components/LikertBlock.tsx
import React from "react";
import type { Likert } from "../types";

type Item = { id: string; text: string };

export default function LikertBlock(props: {
  title: string;
  items: Item[];
  valueMap: Record<string, Likert | undefined>;
  onChange: (id: string, v: Likert) => void;
  anchors?: string[];
  missingIds?: string[];
}) {
  const scale = [1, 2, 3, 4, 5, 6, 7] as const;
  const missingSet = new Set(props.missingIds ?? []);
  const leftAnchor = props.anchors?.[0] ?? "";
  const rightAnchor = props.anchors?.[1] ?? "";

  return (
    <div className="panel">
      <div className="sectionHead">
        <div className="sectionTitleZh" style={{ fontSize: 18 }}>{props.title}</div>
      </div>

      <div className="gfGridWrap">
        <table className="gfGrid" role="table">
          <thead>
            <tr>
              <th className="gfThLeft" />
              {scale.map((v) => (
                <th key={v} className="gfTh">
                  <div className="gfColLabel">{v}</div>
                </th>
              ))}
            </tr>
            <tr>
              <th className="gfThLeft gfThLeftSub" />
              {scale.map((v) => (
                <th key={`sub-${v}`} className="gfThSub">
                  {v === 1 ? <div className="gfSubLabel">{leftAnchor}</div> : null}
                  {v === 7 ? <div className="gfSubLabel">{rightAnchor}</div> : null}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {props.items.map((it, idx) => {
              const selected = props.valueMap?.[it.id];
              const isMissing = missingSet.has(it.id);

              return (
                <tr
                  key={it.id}
                  // ✅ Giữ ID này để hàm handleNext có thể cuộn tới đúng câu bị thiếu
                  id={`block-${it.id}`} 
                  className={[
                    "gfTr",
                    idx % 2 === 1 ? "gfRowAlt" : "",
                    isMissing ? "gfRowMissing" : "",
                  ].join(" ")}
                >
                  <td className="gfTdLeft">
                    <div className="gfRowLabel">{it.text}</div>
                  </td>

                  {scale.map((v) => (
                    <td key={`${it.id}-${v}`} className="gfTd">
                      <label className="gfRadioCell">
                        <input
                          type="radio"
                          name={it.id}
                          checked={selected === v}
                          onChange={() => props.onChange(it.id, v)}
                        />
                        <span className="gfRadioDot" />
                      </label>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
          </div>
  );
}