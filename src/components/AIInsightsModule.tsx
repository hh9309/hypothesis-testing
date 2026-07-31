import React, { useState, useEffect } from 'react';
import { TestInputData, HypothesisResult, AssumptionCheckResult } from '../types';
import { computeTestResult, checkAssumptions } from '../utils/stats';
import { getStoredLLMConfig, callLLMAPI, LLMConfig } from '../utils/llmClient';
import { LLMSettingsModal } from './LLMSettingsModal';
import { 
  Sparkles, 
  Settings, 
  Send, 
  Loader2, 
  MessageSquare, 
  Trash2, 
  Bot, 
  User, 
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

interface AIInsightsModuleProps {
  inputData: TestInputData;
  aiText: string;
  setAiText: (text: string) => void;
  onNavigateToReport?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  modelName?: string;
}

export const AIInsightsModule: React.FC<AIInsightsModuleProps> = ({
  inputData,
  aiText,
  setAiText,
  onNavigateToReport,
}) => {
  const result: HypothesisResult = computeTestResult(inputData);
  const assumptions: AssumptionCheckResult = checkAssumptions(inputData);

  // AI Insights Generation State
  const [loading, setLoading] = useState<boolean>(false);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // LLM Settings Modal State
  const [isLlmModalOpen, setIsLlmModalOpen] = useState<boolean>(false);
  const [llmModalNotice, setLlmModalNotice] = useState<string>('');
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({ apiKey: '', model: 'gemini-3.6-flash' });

  // Interactive AI Chat Engine State (移出来的实时对话交互中心)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  useEffect(() => {
    setLlmConfig(getStoredLLMConfig());
    // 默认提供一条欢迎消息
    setChatMessages([
      {
        id: 'welcome-1',
        sender: 'ai',
        text: `你好！我是当前实验室绑定的【${getStoredLLMConfig().model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro'}】 AI 统计对话助手。您可以随时向我提问推断统计学概念、推导过程或当前 ${result.testName} 的物理含义。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelName: getStoredLLMConfig().model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro',
      },
    ]);
  }, [result.testName]);

  // 刷新 LLM 配置
  const handleConfigSaved = (config: LLMConfig) => {
    setLlmConfig(config);
    setErrorMsg('');
  };

  // 生成 AI 洞察分析报告
  const generateAIInsight = async () => {
    const currentConfig = getStoredLLMConfig();
    setLlmConfig(currentConfig);

    if (!currentConfig.apiKey || !currentConfig.apiKey.trim()) {
      setErrorMsg('所有大模型调用必须输入 API-Key 后才能调用！请点击“大模型设置”进行绑定。');
      setLlmModalNotice('所有大模型调用必须输入 API-Key 后才能调用！请在下方手工输入 API-Key 并确认。');
      setIsLlmModalOpen(true);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const prompt = `
你是一位精通推断统计学与数据建模分析的资深统计学教授。
请根据以下假设检验与推断统计实验室的完整计算数据，生成一份结构严密、符合国际学术规范（APA 7th Standard）且具备落地价值的【假设检验与推断统计分析学术报告】。

【输入数据与检验结果】
- 检验类型: ${result.testName}
- 检验方向: ${inputData.alternative === 'two_sided' ? '双侧检验' : inputData.alternative === 'greater' ? '右侧单尾检验' : '左侧单尾检验'}
- 显著性水平 α: ${result.alpha}
- 样本参数/数据信息: ${JSON.stringify(inputData)}
- 计算检验统计量: ${result.statisticName} = ${result.statisticValue.toFixed(4)}
- 自由度 df: ${JSON.stringify(result.df)}
- 精确 p 值: ${result.pValue}
- 临界值: ${JSON.stringify(result.criticalValue)}
- 假设决策: ${result.rejectH0 ? '拒绝原假设 H0 (Statistically Significant)' : '无法拒绝原假设 H0 (Not Statistically Significant)'}
- APA 表达: ${result.apaFormat}
- 前提假定审查: 正态性(${assumptions.normality.message})，方差齐性(${assumptions.homogeneity.message})，独立性(${assumptions.independence.message})
- 用户附加特定场景/问题: ${userQuestion || '无'}

请严格按照以下 6 个结构化部分撰写学术报告（使用 Markdown 格式，保证标题清晰包含 6 个部分）：

### 📊 一、 实验背景与数据特征概览
分析本统计检验的研究背景，总结样本数据特征（样本量 n、均值、标准差、标准误 SE），说明变量的数据类型与测量尺度。

### 🔬 二、 统计前提假设合规性审查
详细评估三大前提假设（正态性 Shapiro-Wilk、方差齐性 Levene / F 检验、样本独立性）。如假定违反，提供修正方案（如 Welch's t-test、Mann-Whitney U、Kruskal-Wallis 等非参数方法）。

### 📐 三、 假设系统构建与统计推断过程
形式化写出原假设 H₀ 与备择假设 H₁。列出检验统计量 (${result.statisticName}) 的推导计算公式、实际算出的统计量数值，并结合自由度 df 与临界值 (Critical Value) 门槛解释拒绝域边界。

### 🎯 四、 P 值显著性检验决策与区间估计
对比 p 值与显著性水准 α (${result.alpha})。结合 95% 置信区间 [LL, UL] 说明总体参数的真值估计范围，给出明确的拒绝/无法拒绝 H₀ 决策推论。

### 📏 五、 效应量强度与两类错误风险控制
计算与评价统计效应量（如 Cohen's d, Eta-squared 等），判定效应强度（微弱/中等/强效应）。剖析第一类错误 (Type I Error, α) 与第二类错误 (Type II Error, β) 的控制情况及统计功效 (1-β)。

### 📝 六、 APA 7th 标准学术规范表述与落地建言
提供符合 APA 7th 期刊出版标准的标准中英文段落陈述。并结合实际业务/学术场景（如 A/B 测试决策、临床新药疗效评价、产品质量控制）给出具体落地的行动建言。
`;

      const responseText = await callLLMAPI(prompt, currentConfig);
      setAiText(responseText);
    } catch (err: any) {
      if (err.message === 'NO_API_KEY') {
        setErrorMsg('缺失 API-Key，无法调用大模型。请点击右上角设置绑定。');
        setLlmModalNotice('请输入有效的 API-Key 才能生成大模型洞察。');
        setIsLlmModalOpen(true);
      } else {
        setErrorMsg(err.message || '大模型调用失败，请检查网络或 API-Key 是否正确。');
      }
    } finally {
      setLoading(false);
    }
  };

  // 发送实时对话消息
  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim()) return;

    const currentConfig = getStoredLLMConfig();
    setLlmConfig(currentConfig);

    if (!currentConfig.apiKey || !currentConfig.apiKey.trim()) {
      setErrorMsg('请先点击右上角“大模型设置”绑定个人 API-Key 后方可对话！');
      setLlmModalNotice('调用实时对话必须先绑定 API-Key。');
      setIsLlmModalOpen(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setIsChatLoading(true);

    try {
      const activeModelLabel = currentConfig.model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro';
      const prompt = `你是一位精通推断统计学与假设检验教学的高级统计学家。
当前实验室选取的检验为：${result.testName} (统计量 = ${result.statisticValue.toFixed(4)}, p = ${result.pValue < 0.001 ? '<0.001' : result.pValue.toFixed(4)}, α = ${result.alpha})。

请回答用户关于推断统计学的提问或对话：
"${textToSend.trim()}"

请用逻辑清晰、权威易懂、富有条理的语言回答。`;

      const replyText = await callLLMAPI(prompt, currentConfig);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelName: activeModelLabel,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ 对话失败: ${err.message || '请检查 API-Key 或网络状态。'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelName: currentConfig.model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro',
      };
      setChatMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 快捷问题模版
  const presetQuestions = [
    `如何向非专业人士解释当前 ${result.testName} 的 p 值与 Alpha 区别？`,
    `结合当前数据的 Cohen's d 效应量，如何评估实际业务落地价值？`,
    `假设检验中的单尾检验与双尾检验该如何选择与防范决策风险？`,
    `如果不满足正态性或方差齐性假定，应该采用哪些非参数检定方法？`,
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 模块标头与设置指示 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Module 7</span>
              </span>
              <span className="text-slate-400 text-xs">• 智能推断与对话中心</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              7. AI 洞察与大模型实时交互中心
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              支持一键生成符合 APA 7th 标准的深度学术推导与业务落地洞察，并提供沉浸式 AI 大模型实时统计提问对话引擎。
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                setLlmModalNotice('');
                setIsLlmModalOpen(true);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <Settings className="w-4 h-4 text-blue-300" />
              <span>大模型设置 ({llmConfig.model === 'gemini-3.6-flash' ? 'Gemini 3.6' : 'DeepSeek V4'})</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${llmConfig.apiKey ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'}`}>
                {llmConfig.apiKey ? 'Key 已绑定' : '未配置 Key'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 错误警告框 */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between animate-shake">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={() => {
              setLlmModalNotice('请在此手工绑定有效 API-Key');
              setIsLlmModalOpen(true);
            }}
            className="px-3 py-1 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            去设置 Key
          </button>
        </div>
      )}

      {/* 区域一：大模型学术与业务洞察生成器 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                一、 AI 深度学术与业务洞察生成器
              </h3>
              <p className="text-xs text-slate-500">
                根据当前的假设检验数据 ({result.testName})，由大模型自动进行多维推导
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={generateAIInsight}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>大模型推理思考中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{aiText ? '重新生成 AI 洞察' : '生成 AI 深度洞察'}</span>
                </>
              )}
            </button>

            {aiText && onNavigateToReport && (
              <button
                onClick={onNavigateToReport}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <span>前往报告导出</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 附加自定义需求 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>附加特定研究背景或定制分析需求 (可选)</span>
          </label>
          <input
            type="text"
            placeholder="例如：本研究为某互联网产品新算法 A/B 测试，关注转化率提升安全性；或某新药临床双盲试验..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* 生成成果展示 */}
        {aiText ? (
          <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-xs text-blue-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>大模型生成的 6 大部分深度学术与业务洞察已完成</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Model: {llmConfig.model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro'}
              </span>
            </div>
            <div className="prose prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap">
              {aiText}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
            <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">尚未生成 AI 洞察分析</p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                点击上方“生成 AI 深度洞察”按钮，大模型将自动解析您的统计量 ({result.statisticName} = {result.statisticValue.toFixed(2)}, p = {result.pValue < 0.001 ? '<.001' : result.pValue.toFixed(4)})，推导结构化学术报告。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 区域二：【大模型实时对话交互中心 (Ask AI Engine)】（专用于移出来的实时交互） */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-base">
                  二、 大模型实时对话交互中心 (Ask AI Engine)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {llmConfig.model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                移至主界面的沉浸式 AI 提问终端，随时向选定大模型自由询问统计学难题
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChatMessages([])}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-xl font-medium transition-colors flex items-center space-x-1 cursor-pointer"
              title="清空当前对话记录"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空记录</span>
            </button>
          </div>
        </div>

        {/* 快捷提问热词推荐 */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>快捷统计学提问模板（点击直接向 AI 发问）：</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChatMessage(q)}
                disabled={isChatLoading}
                className="text-left p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-xl text-xs text-slate-700 transition-all flex items-start space-x-2 cursor-pointer group"
              >
                <span className="text-blue-500 font-mono text-[10px] shrink-0 mt-0.5">[{idx + 1}]</span>
                <span className="group-hover:text-blue-700 leading-tight">{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 沉浸式聊天面板 */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-4 min-h-[320px] max-h-[500px] overflow-y-auto shadow-inner">
          {chatMessages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs space-y-2">
              <Bot className="w-8 h-8 text-indigo-400 mx-auto opacity-60 animate-bounce" />
              <p>暂无对话，在上方点击快捷问题或下方输入框发问吧！</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 leading-relaxed space-y-1.5 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-70 border-b border-white/10 pb-1 mb-1">
                    <span className="font-bold">
                      {msg.sender === 'user' ? '您' : (msg.modelName || 'AI 大模型')}
                    </span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isChatLoading && (
            <div className="flex items-center space-x-3 text-xs text-indigo-300 bg-slate-800/80 p-3 rounded-2xl border border-slate-700 w-fit animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>{llmConfig.model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro'} 正在深度思考统计学推理...</span>
            </div>
          )}
        </div>

        {/* 提问输入框 */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <textarea
              rows={2}
              placeholder={`向 ${llmConfig.model === 'gemini-3.6-flash' ? 'Gemini 3.6 Flash' : 'DeepSeek V4 Pro'} 提问任何关于假设检验、p值推导、效应量与论文规范的问题...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-2xl p-3.5 pr-28 text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            />
            <button
              onClick={() => handleSendChatMessage()}
              disabled={isChatLoading || !chatInput.trim()}
              className="absolute right-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {isChatLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>发送提问</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center justify-between px-1">
            <span>提示: 按 Enter 发送消息，Shift + Enter 换行。</span>
            <span className="font-mono">Current Engine: {llmConfig.model}</span>
          </p>
        </div>

      </div>

      {/* 大模型设置 Modal */}
      <LLMSettingsModal
        isOpen={isLlmModalOpen}
        onClose={() => setIsLlmModalOpen(false)}
        onConfigSaved={handleConfigSaved}
        initialNotice={llmModalNotice}
      />
    </div>
  );
};
