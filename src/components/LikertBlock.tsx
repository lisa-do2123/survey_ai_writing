// src/components/LikertBlock.tsx
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
      {/* CSS Inline để xử lý hiển thị dọc trên điện thoại */}
      <style>{`
        @media (max-width: 600px) {
          .gfGrid thead { display: none; } /* Ẩn header bảng trên mobile */
          .gfGrid, .gfGrid tbody, .gfGrid tr, .gfGrid td { 
            display: block; 
            width: 100%; 
          }
          .gfTr { 
            padding: 15px 10px; 
            border-bottom: 2px solid #eee; 
          }
          .gfTdLeft { 
            text-align: left; 
            font-weight: bold; 
            margin-bottom: 12px; 
            padding: 0 !important;
          }
          .gfTd { 
            display: inline-block !important; 
            width: 14.28% !important; /* Chia đều 7 nút theo chiều ngang hoặc bạn có thể chỉnh dọc */
            padding: 5px 0 !important;
          }
          /* Giao diện dọc hoàn toàn cho từng radio button */
          .mobileLikertWrap {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 10px;
          }
          .mobileOption {
            display: flex;
            align-items: center;
            padding: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
          }
          .mobileOption.selected {
            background: rgba(109,46,112,0.08);
            border-color: var(--primary);
          }
          .mobileValue {
            width: 24px;
            font-weight: bold;
            color: var(--primary);
          }
          .mobileText { font-size: 14px; flex: 1; }
        }
        
        /* Chỉ hiện bảng trên màn hình lớn */
        @media (min-width: 601px) {
          .mobileOnly { display: none; }
        }
      `}</style>

      <div className="sectionHead">
        <div className="sectionTitleZh" style={{ fontSize: 18 }}>{props.title}</div>
      </div>

      <div className="gfGridWrap">
        {/* PC/Tablet: Hiển thị bảng ngang truyền thống */}
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
                  id={`block-${it.id}`} 
                  className={[
                    "gfTr",
                    idx % 2 === 1 ? "gfRowAlt" : "",
                    isMissing ? "gfRowMissing" : "",
                  ].join(" ")}
                >
                  <td className="gfTdLeft">
                    <div className="gfRowLabel">{it.text}</div>
                    
                    {/* Mobile: Chỉ hiển thị khối này trên điện thoại */}
                    <div className="mobileOnly mobileLikertWrap">
                      <div className="btnRow" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ color: '#64748b' }}>{leftAnchor}</span>
                        <span style={{ color: '#64748b' }}>{rightAnchor}</span>
                      </div>
                      {scale.map((v) => (
                        <div 
                          key={v} 
                          className={`mobileOption ${selected === v ? 'selected' : ''}`}
                          onClick={() => props.onChange(it.id, v)}
                        >
                          <span className="mobileValue">{v}</span>
                          <span className="mobileText">
                            {v === 1 ? leftAnchor : v === 7 ? rightAnchor : ""}
                          </span>
                          <input
                            type="radio"
                            style={{ margin: 0 }}
                            checked={selected === v}
                            readOnly
                          />
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* PC: Ẩn các cột này trên điện thoại thông qua CSS display:none ở header */}
                  {scale.map((v) => (
                    <td key={`${it.id}-${v}`} className="gfTd desktopOnly">
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