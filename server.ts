import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
app.use(express.json());

const PORT = 3000;

// Gemini AI client initialization
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint for AI Insights
app.post("/api/ai-insight", async (req, res) => {
  try {
    const { testType, sampleInfo, testResults, userQuestion } = req.body;
    
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ 
        error: "未配置 GEMINI_API_KEY 环境变置。",
        isFallback: true,
      });
    }

    const prompt = `
你是一位精通推断统计学与数据分析的专业统计学家和数据建模专家。
请根据以下假设检验与推断统计实验室的模拟数据，生成一份结构严密、逻辑清晰、权威且易于理解的学术与业务洞察分析。

测试类型: ${testType || '未指定'}
样本信息/参数: ${JSON.stringify(sampleInfo || {})}
检验结果与统计量: ${JSON.stringify(testResults || {})}
用户附加问题或场景描述: ${userQuestion || '无'}

请提供以下 4 个部分的结构化分析（使用 Markdown 格式）：
1. 📊 **假设检验推导与结论**：明确原假设 H0 与备择假设 H1，给出拒绝/无法拒绝 H0 的明确结论及统计效应量分析。
2. 🔬 **前提假设合规性检查**：评估正态性（Shapiro-Wilk）、方差齐性（Levene/F检验）及独立性假定，并说明假定不满足时的替代方案（如 Mann-Whitney U / Kruskal-Wallis 等非参数检验）。
3. 💡 **业务与学术落地建议**：说明此检验结果在实际落地（如临床新药、A/B测试、质量控制等）中的现实意义与风险防范（第一类/第二类错误风险）。
4. 📝 **学术论文 APA 规范描述**：给出符合标准 APA 格式（如 t(df) = x.xx, p = .xxx, Cohen's d = x.xx）的论文正文段落表述。
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    res.status(500).json({ error: error.message || "生成 AI 洞察失败" });
  }
});

// API Endpoint for AI Term Explanation
app.post("/api/explain-term", async (req, res) => {
  try {
    const { term, context } = req.body;
    
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ 
        error: "未配置 GEMINI_API_KEY 环境变量。",
        isFallback: true,
      });
    }

    const contextStr = context ? JSON.stringify(context) : "未提供具体上下文数据";

    const prompt = `
你是一位极其擅长将复杂统计学概念通俗化讲解的顶级统计学导师。
请为学习者详细解释统计学术语：【${term}】。

当前特定试验/分析上下文信息：
${contextStr}

请按以下 3 个核心维度给出结构化且形象生动的解答（支持 Markdown 格式，语言清晰直观、富有启发性）：

1. 💡 **通俗物理含义与直觉比喻 (Metaphor & Intuition)**
   - 用生活中的直观点或物理比喻（如排队、天平、杠杆、噪音控制等）解释【${term}】的实质，避免纯粹枯燥的公式堆砌。

2. 🎯 **在假设检验中的核心机制 (Role in Hypothesis Testing)**
   - 说明为什么在假设检验和统计推断中必须要关注【${term}】，它如何影响结论的准确性与决策风险。

3. 🔍 **结合当前上下文数据的具体解读 (Contextual Deep Dive)**
   - 结合上述提供的当前试验参数/统计量数据，具体解释在此场景下【${term}】的具体数值或假定状态代表了什么现实物理意义。
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Term Explanation Error:", error);
    res.status(500).json({ error: error.message || "生成术语 AI 解释失败" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
