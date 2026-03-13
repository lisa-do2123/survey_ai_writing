// server/prompt/cond2StoryPrompt.js

function cleanText(value) {
  return String(value ?? "").trim();
}

function optionalValue(value, fallback = "無") {
  const text = cleanText(value);
  return text || fallback;
}

export function buildCond2Messages(input = {}) {
  const targetAudience = optionalValue(input.targetAudience);
  const usageScenario = optionalValue(input.usageScenario);
  const additionalRequirements = optionalValue(input.additionalRequirements);

  const system = `
你是一位協助生成廣告文案的助手。
請嚴格依照使用者提供的產品資訊與構想，產出一則完整的故事型廣告。
你只能輸出最終廣告故事本身，不得加入標題、前言、說明、條列、註解或任何額外評論。
`.trim();

  const user = `
請根據以下產品資訊與構想，撰寫一則具創意的故事型廣告。

產品：SmartBottle —— 一款智慧水瓶，能透過震動提醒使用者喝水，幫助養成健康的飲水習慣。

構想：
目標對象：${targetAudience}
使用情境：${usageScenario}
額外要求（選填）：${additionalRequirements}

評估重點：創意性、情感共鳴與說服力。

要求：
- 故事需依據以上構想撰寫。
- 以目標對象與使用情境作為故事的主要背景。
- 以單一段落撰寫，必須包含至少 5 句完整句子（建議 5–7 句），不得少於 5 句。
- 產品需自然地融入故事情境中。
- 不得添加產品描述以外的功能。
- 不得加入標題、說明或任何額外評論。

請僅輸出最終的廣告故事內容。
`.trim();

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function buildCond2PromptText(input = {}) {
  const messages = buildCond2Messages(input);
  return messages
    .map((m) => `[${String(m.role).toUpperCase()}]\n${m.content}`)
    .join("\n\n");
}