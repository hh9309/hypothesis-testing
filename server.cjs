var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_genai = require("@google/genai");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
app.use(import_express.default.json());
var PORT = 3e3;
var getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
app.post("/api/ai-insight", async (req, res) => {
  try {
    const { testType, sampleInfo, testResults, userQuestion } = req.body;
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({
        error: "\u672A\u914D\u7F6E GEMINI_API_KEY \u73AF\u5883\u53D8\u7F6E\u3002",
        isFallback: true
      });
    }
    const prompt = `
\u4F60\u662F\u4E00\u4F4D\u7CBE\u901A\u63A8\u65AD\u7EDF\u8BA1\u5B66\u4E0E\u6570\u636E\u5206\u6790\u7684\u4E13\u4E1A\u7EDF\u8BA1\u5B66\u5BB6\u548C\u6570\u636E\u5EFA\u6A21\u4E13\u5BB6\u3002
\u8BF7\u6839\u636E\u4EE5\u4E0B\u5047\u8BBE\u68C0\u9A8C\u4E0E\u63A8\u65AD\u7EDF\u8BA1\u5B9E\u9A8C\u5BA4\u7684\u6A21\u62DF\u6570\u636E\uFF0C\u751F\u6210\u4E00\u4EFD\u7ED3\u6784\u4E25\u5BC6\u3001\u903B\u8F91\u6E05\u6670\u3001\u6743\u5A01\u4E14\u6613\u4E8E\u7406\u89E3\u7684\u5B66\u672F\u4E0E\u4E1A\u52A1\u6D1E\u5BDF\u5206\u6790\u3002

\u6D4B\u8BD5\u7C7B\u578B: ${testType || "\u672A\u6307\u5B9A"}
\u6837\u672C\u4FE1\u606F/\u53C2\u6570: ${JSON.stringify(sampleInfo || {})}
\u68C0\u9A8C\u7ED3\u679C\u4E0E\u7EDF\u8BA1\u91CF: ${JSON.stringify(testResults || {})}
\u7528\u6237\u9644\u52A0\u95EE\u9898\u6216\u573A\u666F\u63CF\u8FF0: ${userQuestion || "\u65E0"}

\u8BF7\u63D0\u4F9B\u4EE5\u4E0B 4 \u4E2A\u90E8\u5206\u7684\u7ED3\u6784\u5316\u5206\u6790\uFF08\u4F7F\u7528 Markdown \u683C\u5F0F\uFF09\uFF1A
1. \u{1F4CA} **\u5047\u8BBE\u68C0\u9A8C\u63A8\u5BFC\u4E0E\u7ED3\u8BBA**\uFF1A\u660E\u786E\u539F\u5047\u8BBE H0 \u4E0E\u5907\u62E9\u5047\u8BBE H1\uFF0C\u7ED9\u51FA\u62D2\u7EDD/\u65E0\u6CD5\u62D2\u7EDD H0 \u7684\u660E\u786E\u7ED3\u8BBA\u53CA\u7EDF\u8BA1\u6548\u5E94\u91CF\u5206\u6790\u3002
2. \u{1F52C} **\u524D\u63D0\u5047\u8BBE\u5408\u89C4\u6027\u68C0\u67E5**\uFF1A\u8BC4\u4F30\u6B63\u6001\u6027\uFF08Shapiro-Wilk\uFF09\u3001\u65B9\u5DEE\u9F50\u6027\uFF08Levene/F\u68C0\u9A8C\uFF09\u53CA\u72EC\u7ACB\u6027\u5047\u5B9A\uFF0C\u5E76\u8BF4\u660E\u5047\u5B9A\u4E0D\u6EE1\u8DB3\u65F6\u7684\u66FF\u4EE3\u65B9\u6848\uFF08\u5982 Mann-Whitney U / Kruskal-Wallis \u7B49\u975E\u53C2\u6570\u68C0\u9A8C\uFF09\u3002
3. \u{1F4A1} **\u4E1A\u52A1\u4E0E\u5B66\u672F\u843D\u5730\u5EFA\u8BAE**\uFF1A\u8BF4\u660E\u6B64\u68C0\u9A8C\u7ED3\u679C\u5728\u5B9E\u9645\u843D\u5730\uFF08\u5982\u4E34\u5E8A\u65B0\u836F\u3001A/B\u6D4B\u8BD5\u3001\u8D28\u91CF\u63A7\u5236\u7B49\uFF09\u4E2D\u7684\u73B0\u5B9E\u610F\u4E49\u4E0E\u98CE\u9669\u9632\u8303\uFF08\u7B2C\u4E00\u7C7B/\u7B2C\u4E8C\u7C7B\u9519\u8BEF\u98CE\u9669\uFF09\u3002
4. \u{1F4DD} **\u5B66\u672F\u8BBA\u6587 APA \u89C4\u8303\u63CF\u8FF0**\uFF1A\u7ED9\u51FA\u7B26\u5408\u6807\u51C6 APA \u683C\u5F0F\uFF08\u5982 t(df) = x.xx, p = .xxx, Cohen's d = x.xx\uFF09\u7684\u8BBA\u6587\u6B63\u6587\u6BB5\u843D\u8868\u8FF0\u3002
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("AI Insight Error:", error);
    res.status(500).json({ error: error.message || "\u751F\u6210 AI \u6D1E\u5BDF\u5931\u8D25" });
  }
});
app.post("/api/explain-term", async (req, res) => {
  try {
    const { term, context } = req.body;
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({
        error: "\u672A\u914D\u7F6E GEMINI_API_KEY \u73AF\u5883\u53D8\u91CF\u3002",
        isFallback: true
      });
    }
    const contextStr = context ? JSON.stringify(context) : "\u672A\u63D0\u4F9B\u5177\u4F53\u4E0A\u4E0B\u6587\u6570\u636E";
    const prompt = `
\u4F60\u662F\u4E00\u4F4D\u6781\u5176\u64C5\u957F\u5C06\u590D\u6742\u7EDF\u8BA1\u5B66\u6982\u5FF5\u901A\u4FD7\u5316\u8BB2\u89E3\u7684\u9876\u7EA7\u7EDF\u8BA1\u5B66\u5BFC\u5E08\u3002
\u8BF7\u4E3A\u5B66\u4E60\u8005\u8BE6\u7EC6\u89E3\u91CA\u7EDF\u8BA1\u5B66\u672F\u8BED\uFF1A\u3010${term}\u3011\u3002

\u5F53\u524D\u7279\u5B9A\u8BD5\u9A8C/\u5206\u6790\u4E0A\u4E0B\u6587\u4FE1\u606F\uFF1A
${contextStr}

\u8BF7\u6309\u4EE5\u4E0B 3 \u4E2A\u6838\u5FC3\u7EF4\u5EA6\u7ED9\u51FA\u7ED3\u6784\u5316\u4E14\u5F62\u8C61\u751F\u52A8\u7684\u89E3\u7B54\uFF08\u652F\u6301 Markdown \u683C\u5F0F\uFF0C\u8BED\u8A00\u6E05\u6670\u76F4\u89C2\u3001\u5BCC\u6709\u542F\u53D1\u6027\uFF09\uFF1A

1. \u{1F4A1} **\u901A\u4FD7\u7269\u7406\u542B\u4E49\u4E0E\u76F4\u89C9\u6BD4\u55BB (Metaphor & Intuition)**
   - \u7528\u751F\u6D3B\u4E2D\u7684\u76F4\u89C2\u70B9\u6216\u7269\u7406\u6BD4\u55BB\uFF08\u5982\u6392\u961F\u3001\u5929\u5E73\u3001\u6760\u6746\u3001\u566A\u97F3\u63A7\u5236\u7B49\uFF09\u89E3\u91CA\u3010${term}\u3011\u7684\u5B9E\u8D28\uFF0C\u907F\u514D\u7EAF\u7CB9\u67AF\u71E5\u7684\u516C\u5F0F\u5806\u780C\u3002

2. \u{1F3AF} **\u5728\u5047\u8BBE\u68C0\u9A8C\u4E2D\u7684\u6838\u5FC3\u673A\u5236 (Role in Hypothesis Testing)**
   - \u8BF4\u660E\u4E3A\u4EC0\u4E48\u5728\u5047\u8BBE\u68C0\u9A8C\u548C\u7EDF\u8BA1\u63A8\u65AD\u4E2D\u5FC5\u987B\u8981\u5173\u6CE8\u3010${term}\u3011\uFF0C\u5B83\u5982\u4F55\u5F71\u54CD\u7ED3\u8BBA\u7684\u51C6\u786E\u6027\u4E0E\u51B3\u7B56\u98CE\u9669\u3002

3. \u{1F50D} **\u7ED3\u5408\u5F53\u524D\u4E0A\u4E0B\u6587\u6570\u636E\u7684\u5177\u4F53\u89E3\u8BFB (Contextual Deep Dive)**
   - \u7ED3\u5408\u4E0A\u8FF0\u63D0\u4F9B\u7684\u5F53\u524D\u8BD5\u9A8C\u53C2\u6570/\u7EDF\u8BA1\u91CF\u6570\u636E\uFF0C\u5177\u4F53\u89E3\u91CA\u5728\u6B64\u573A\u666F\u4E0B\u3010${term}\u3011\u7684\u5177\u4F53\u6570\u503C\u6216\u5047\u5B9A\u72B6\u6001\u4EE3\u8868\u4E86\u4EC0\u4E48\u73B0\u5B9E\u7269\u7406\u610F\u4E49\u3002
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("AI Term Explanation Error:", error);
    res.status(500).json({ error: error.message || "\u751F\u6210\u672F\u8BED AI \u89E3\u91CA\u5931\u8D25" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
