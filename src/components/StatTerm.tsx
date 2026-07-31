import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Sparkles, X, BookOpen, Send, Loader2, ArrowRight, Lightbulb, CheckCircle, ExternalLink } from 'lucide-react';
import { findStatTerm, STAT_TERMS_DATABASE, StatTermDefinition } from '../data/statTerms';
import { callLLMAPI, getStoredLLMConfig } from '../utils/llmClient';

interface StatTermProps {
  term: string;
  children?: React.ReactNode;
  context?: Record<string, any>;
  inline?: boolean;
  showSparkle?: boolean;
  className?: string;
}

export const StatTerm: React.FC<StatTermProps> = ({
  term,
  children,
  context,
  inline = true,
  showSparkle = false,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'meta' | 'ai' | 'ask'>('meta');
  const [customQuestion, setCustomQuestion] = useState('');
  const [followUpLogs, setFollowUpLogs] = useState<{ q: string; a: string }[]>([]);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);

  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Look up term from DB or build dynamic fallback
  const statDef: StatTermDefinition = findStatTerm(term) || {
    id: term,
    name: term,
    shortTitle: term,
    aliases: [term],
    category: '核心概念',
    quickDef: `统计学术语：${term}。点击查看 AI 大模型生成的深度通俗解释与物理含义推导。`,
    physicalAnalogy: `用直观的日常生活经验解释【${term}】在统计推断与假设检验中的核心机制。`,
    formulaOrRule: `结合当前具体的检验方法与样本参数进行评估。`,
    importance: `理解【${term}】有助于准确把控统计显著性与推断风险。`,
  };

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  const fetchAiExplanation = async () => {
    if (aiText || isLoadingAi) return;
    setIsLoadingAi(true);
    try {
      const config = getStoredLLMConfig();
      if (!config.apiKey) {
        setAiText(`**通俗解读与物理含义：**\n${statDef.quickDef}\n\n**生活直观比喻：**\n${statDef.physicalAnalogy}\n\n**当前样本数据意义：**\n${statDef.importance}\n\n*(提示：可在“AI 洞察”模块标题栏点击齿轮设置 API-Key，获取专属大模型深度推演。)*`);
        return;
      }

      const prompt = `你是一位精通统计学概念通俗解释的导师。请详细讲解【${statDef.name}】。\n上下文：${JSON.stringify(context || {})}\n请包含物理比喻、假设检验中的机制及当前样本含义。`;
      const resText = await callLLMAPI(prompt, config);
      setAiText(resText);
    } catch (err) {
      setAiText(`**通俗解读与物理含义：**\n${statDef.quickDef}\n\n**生活直观比喻：**\n${statDef.physicalAnalogy}`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleOpenModal = () => {
    setIsHovered(false);
    setIsModalOpen(true);
    fetchAiExplanation();
  };

  const handleSendFollowUp = async () => {
    if (!customQuestion.trim() || isAskingFollowUp) return;
    const q = customQuestion.trim();
    setCustomQuestion('');
    setIsAskingFollowUp(true);

    try {
      const config = getStoredLLMConfig();
      if (!config.apiKey) {
        setFollowUpLogs((prev) => [
          ...prev,
          { q, a: '请先在“AI 洞察”标题行的齿轮图标中设置 API-Key 才能提问大模型。' },
        ]);
        return;
      }

      const prompt = `关于【${statDef.name}】，学习者提出了进一步追问："${q}"。上下文为：${JSON.stringify(context || {})}。请给出通俗易懂的解答。`;
      const resText = await callLLMAPI(prompt, config);
      setFollowUpLogs((prev) => [...prev, { q, a: resText }]);
    } catch (err: any) {
      setFollowUpLogs((prev) => [
        ...prev,
        { q, a: `生成回答失败：${err.message || '请检查 API-Key 配置'}` },
      ]);
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  return (
    <>
      {/* Trigger element */}
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleOpenModal}
        className={`relative inline-flex items-center gap-1 cursor-pointer group transition-all rounded px-1 py-0.5 font-medium ${
          inline
            ? 'text-[#5A6354] underline decoration-dotted decoration-[#7D8E7E]/70 hover:decoration-[#7D8E7E] hover:text-[#7D8E7E] hover:bg-[#F2EDE4]'
            : 'bg-[#F2EDE4] text-[#5A6354] hover:bg-[#E5DFD3] border border-[#E5DFD3]'
        } ${className}`}
      >
        <span>{children || statDef.shortTitle}</span>
        {showSparkle ? (
          <Sparkles className="w-3 h-3 text-[#7D8E7E] animate-pulse inline-block" />
        ) : (
          <HelpCircle className="w-3 h-3 text-[#8C8476] group-hover:text-[#7D8E7E] opacity-70 group-hover:opacity-100 transition-opacity inline-block" />
        )}

        {/* Hover Popover Tooltip */}
        {isHovered && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 bg-[#2D2A26] text-white rounded-2xl shadow-xl border border-[#403C37] z-50 text-xs space-y-2 pointer-events-auto animate-fade-in"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center justify-between border-b border-[#403C37] pb-1.5">
              <span className="font-bold text-[#E5DFD3] text-xs flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#A8BBA9]" />
                {statDef.shortTitle}
              </span>
              <span className="text-[10px] bg-[#403C37] text-[#D6C7B2] px-1.5 py-0.5 rounded-md font-mono">
                {statDef.category}
              </span>
            </div>

            <p className="text-[11px] text-[#D6C7B2] leading-relaxed">
              {statDef.quickDef}
            </p>

            <div className="p-2 bg-[#23201D] rounded-xl border border-[#403C37] text-[10px] text-[#A69C8D]">
              <span className="font-bold text-[#A8BBA9] block mb-0.5">💡 生活直观点：</span>
              {statDef.physicalAnalogy}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal();
              }}
              className="w-full py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-[11px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>点击展开 AI 上下文物理深度解析</span>
            </button>

            {/* Triangle tooltip pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2D2A26]" />
          </div>
        )}
      </span>

      {/* Full Modal Dialog when clicked */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#E5DFD3] overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#2D2A26] p-6 text-white flex items-center justify-between border-b border-[#403C37]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#403C37] text-[#D6C7B2] rounded-md">
                    {statDef.category}
                  </span>
                  <span className="text-xs text-[#A69C8D]">学术术语直觉词典</span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {statDef.name}
                </h3>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#A69C8D] hover:text-white hover:bg-[#403C37] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Controls */}
            <div className="flex border-b border-[#E5DFD3] bg-[#F9F7F2] px-6 pt-3 gap-2 text-xs font-bold text-[#5A6354]">
              <button
                onClick={() => setActiveTab('meta')}
                className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'meta'
                    ? 'bg-white text-[#3D3D3D] border-t-2 border-[#7D8E7E] shadow-2xs'
                    : 'text-[#8C8476] hover:text-[#5A6354]'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-[#7D8E7E]" />
                <span>物理含义与直觉比喻</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ai');
                  fetchAiExplanation();
                }}
                className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-white text-[#3D3D3D] border-t-2 border-[#7D8E7E] shadow-2xs'
                    : 'text-[#8C8476] hover:text-[#5A6354]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#7D8E7E]" />
                <span>AI 上下文深度洞察</span>
              </button>

              <button
                onClick={() => setActiveTab('ask')}
                className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ask'
                    ? 'bg-white text-[#3D3D3D] border-t-2 border-[#7D8E7E] shadow-2xs'
                    : 'text-[#8C8476] hover:text-[#5A6354]'
                }`}
              >
                <Send className="w-4 h-4 text-[#7D8E7E]" />
                <span>向 AI 追问该术语</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-[#3D3D3D] leading-relaxed">
              {activeTab === 'meta' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Quick Def */}
                  <div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-1">
                    <div className="font-bold text-[#5A6354] text-xs">📖 官方核心定义</div>
                    <p className="text-xs text-[#3D3D3D] leading-relaxed">{statDef.quickDef}</p>
                  </div>

                  {/* Physical Analogy */}
                  <div className="p-4 bg-[#F4F7F4] rounded-2xl border border-[#C8D6C9] space-y-2">
                    <div className="font-bold text-[#3D523E] text-xs flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#7D8E7E]" />
                      <span>💡 通俗物理直觉与日常生活比喻</span>
                    </div>
                    <p className="text-xs text-[#3D3D3D] leading-relaxed font-medium">
                      {statDef.physicalAnalogy}
                    </p>
                  </div>

                  {/* Formula / Rule & Importance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-1">
                      <div className="font-bold text-[#5A6354]">📐 计算公式或判别法则</div>
                      <div className="font-mono text-[11px] text-[#3D3D3D] bg-white p-2 rounded-xl border border-[#E5DFD3] mt-1">
                        {statDef.formulaOrRule}
                      </div>
                    </div>

                    <div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-1">
                      <div className="font-bold text-[#5A6354]">🎯 在假设检验中的重要性</div>
                      <p className="text-[11px] text-[#7A7267] leading-relaxed">
                        {statDef.importance}
                      </p>
                    </div>
                  </div>

                  {/* Context Banner */}
                  {context && Object.keys(context).length > 0 && (
                    <div className="p-3 bg-[#F2EDE4] rounded-2xl border border-[#D6C7B2] flex items-center justify-between text-[11px] text-[#5A6354]">
                      <span>当前关联试验上下文：{JSON.stringify(context)}</span>
                      <button
                        onClick={() => {
                          setActiveTab('ai');
                          fetchAiExplanation();
                        }}
                        className="text-[#7D8E7E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>结合数据看 AI 解释</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-4 animate-fade-in">
                  {isLoadingAi ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3 text-[#7A7267]">
                      <Loader2 className="w-8 h-8 text-[#7D8E7E] animate-spin" />
                      <p className="text-xs font-bold">AI 大模型正在深度推演【{statDef.shortTitle}】的物理含义与上下文作用...</p>
                    </div>
                  ) : aiText ? (
                    <div className="p-5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] text-[#3D3D3D] leading-relaxed whitespace-pre-wrap font-sans text-xs space-y-2">
                      {aiText}
                    </div>
                  ) : (
                    <div className="p-4 bg-[#FDF6F0] rounded-2xl border border-[#E8C8BE] text-[#8C4332] text-center">
                      未能获取 AI 解释，请重试。
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ask' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] text-xs text-[#7A7267]">
                    对【{statDef.shortTitle}】有疑问？直接输入你困惑的具体点，AI 导师将为你量身解答：
                  </div>

                  {/* Existing Q&A History */}
                  {followUpLogs.map((item, idx) => (
                    <div key={idx} className="space-y-2 text-xs">
                      <div className="p-3 bg-[#F2EDE4] rounded-2xl font-bold text-[#5A6354]">
                        ❓ 问：{item.q}
                      </div>
                      <div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] text-[#3D3D3D] leading-relaxed whitespace-pre-wrap">
                        🤖 答：{item.a}
                      </div>
                    </div>
                  ))}

                  {/* Input form */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder={`针对${statDef.shortTitle}提出你的问题，如：在小样本下为什么重要？`}
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendFollowUp()}
                      className="flex-1 bg-[#F9F7F2] border border-[#E5DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#3D3D3D] focus:outline-hidden"
                    />
                    <button
                      onClick={handleSendFollowUp}
                      disabled={isAskingFollowUp || !customQuestion.trim()}
                      className="px-4 py-2.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isAskingFollowUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>发送</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F9F7F2] border-t border-[#E5DFD3] flex items-center justify-between text-xs text-[#8C8476]">
              <span>推断统计学学术词典 & AI 实时解释系统</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-[#E5DFD3] hover:bg-[#D6C7B2] text-[#5A6354] font-bold rounded-xl transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
