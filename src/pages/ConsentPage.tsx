// src/pages/ConsentPage.tsx
import { useState } from "react";

export default function ConsentPage(props: { onNext: () => void }) {
  const [agree, setAgree] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ✅ HÀM MỚI: Khởi tạo ID người tham gia khi đồng ý
  const handleAgree = async () => {
    if (!agree || isCreating) return;
    
    setIsCreating(true);
    try {
      const res = await fetch("http://localhost:3001/api/participants", {
        method: "POST",
      });
      
      if (!res.ok) throw new Error("Failed to initialize participant");
      
      const data = await res.json();
      
      // Lưu participant_id vào sessionStorage để dùng cho các trang sau
      sessionStorage.setItem("participant_id", data.participant_id);
      
      props.onNext();
    } catch (e) {
      console.error("Init error:", e);
      alert("系統初始化失敗，請檢查網路連線");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="vstack">
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div style={{ fontSize: 35, fontWeight: 900, color: "var(--text)", letterSpacing: -0.2 }}>
          研究說明
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">📝 一、關於本研究</div>
        </div>
        <div className="sectionBodyZh">
          本研究旨在了解人們在進行寫作任務時，如何使用生成式 AI（例如 ChatGPT）作為協作工具，以及相關的寫作體驗與評估。研究結果僅用於學術分析。
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">🕒 二、時間</div>
        </div>
        <div className="sectionBodyZh">
          預計約需 <span className="hl">15 分鐘</span>（前測問卷 → 寫作任務（可自由使用 AI）→ 任務後問卷）。
        </div>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">🎁 三、報酬（獎勵）</div>
        </div>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.85, color: "var(--text)", fontSize: 16 }}>
          <li><b>完成參與：</b>可獲得 <span className="hl">100 元</span> 等值禮券</li>
          <li><b>抽獎機會：</b>將抽出 <span className="hl">3 名</span> 各 <span className="hl">1000 元</span></li>
          <li><b>創意獎勵：</b>作品評選前 <span className="hl">3 名</span>，每名另得 <span className="hl">1000 元</span></li>
        </ul>
      </div>

      <div className="panel">
        <div className="sectionHead">
          <div className="sectionTitleZh">🔒 四、隱私與資料保護</div>
        </div>
        <div className="sectionBodyZh">
          研究資料將以匿名形式進行統計分析，資料 <span className="hl">完全保密</span>，僅供學術用途。
        </div>
      </div>

      <div className="panel consentAction">
        <label className={`hstack consentCheck ${agree ? "isChecked" : ""}`}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span style={{ fontWeight: 900, color: "var(--text)" }}>我已閱讀並同意參與本研究</span>
        </label>

        <div className="btnRow" style={{ justifyContent: "flex-end" }}>
          <button 
            className="primary" 
            disabled={!agree || isCreating} 
            onClick={handleAgree} // ✅ Thay props.onNext bằng handleAgree
          >
            {isCreating ? "初始化中..." : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}