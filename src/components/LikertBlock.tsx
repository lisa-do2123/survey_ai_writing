// src/components/LikertBlock.tsx
import { useEffect, useState } from "react";
import type { Likert } from "../types";

type Item = { id: string; text: string };

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // keep initial value in sync
    setMatches(mql.matches);

    // Newer browsers
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Older Safari fallback (legacy API)
    // NOTE: Do NOT use @ts-expect-error here because TS may not error on these lines,
    // which would trigger "Unused '@ts-expect-error' directive".
    const legacy = mql as unknown as {
      addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
      removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
    };

    legacy.addListener?.(onChange);
    return () => legacy.removeListener?.(onChange);
  }, [query]);

  return matches;
}

export default function LikertBlock(props: {
  title: string;
  items: Item[];
  valueMap: Record<string, Likert | undefined>;
  onChange: (id: string, v: Likert) => void;
  anchors?: string[]; // [left, right]
  missingIds?: string[];
}) {
  const scale = [1, 2, 3, 4, 5, 6, 7] as const;
  const missingSet = new Set(props.missingIds ?? []);
  const leftAnchor = props.anchors?.[0] ?? "";
  const rightAnchor = props.anchors?.[1] ?? "";

  // ✅ Phone layout switch
  const isPhone = useMediaQuery("(max-width: 640px)");

  return (
    <div className="panel">
      <div className="sectionHead">
        <div className="sectionTitleZh" style={{ fontSize: 18 }}>
          {props.title}
        </div>
      </div>

      {/* =========================
          MOBILE: Vertical Likert
          ========================= */}
      {isPhone ? (
        <div className="likertMobile">
          {props.items.map((it) => {
            const selected = props.valueMap?.[it.id];
            const isMissing = missingSet.has(it.id);

            return (
              <div
                key={it.id}
                id={`block-${it.id}`} // ✅ keep for scroll-to-missing
                className={`likertMobileItem ${
                  isMissing ? "likertMobileMissing" : ""
                }`}
              >
                <div className="likertMobileQ">{it.text}</div>

                {(leftAnchor || rightAnchor) && (
                  <div className="likertMobileAnchors">
                    <span className="likertMobileAnchorLeft">{leftAnchor}</span>
                    <span className="likertMobileAnchorRight">
                      {rightAnchor}
                    </span>
                  </div>
                )}

                <div
                  className="likertMobileScale"
                  role="radiogroup"
                  aria-label={it.text}
                >
                  {scale.map((v) => (
                    <label key={`${it.id}-${v}`} className="likertMobileChoice">
                      <input
                        type="radio"
                        name={it.id}
                        checked={selected === v}
                        onChange={() => props.onChange(it.id, v)}
                      />
                      <span className="likertMobileDot" />
                      <span className="likertMobileNum">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =========================
           DESKTOP/TABLET: Grid
           ========================= */
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
                    {v === 1 ? (
                      <div className="gfSubLabel">{leftAnchor}</div>
                    ) : null}
                    {v === 7 ? (
                      <div className="gfSubLabel">{rightAnchor}</div>
                    ) : null}
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
                    id={`block-${it.id}`} // ✅ keep for scroll-to-missing
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
      )}
    </div>
  );
}