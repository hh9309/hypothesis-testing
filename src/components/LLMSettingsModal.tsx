import React, { useState, useEffect } from 'react';
import { Settings, X, Key, Cpu, Check, Eye, EyeOff, Sparkles, Send, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { getStoredLLMConfig, saveLLMConfig, callLLMAPI, LLMConfig } from '../utils/llmClient';

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: LLMConfig) => void;
  initialNotice?: string;
}

export const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  initialNotice,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<'gemini-3.6-flash' | 'deepseek-v4-pro'>('gemini-3.6-flash');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [qaError, setQaError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredLLMConfig();
      setApiKey(stored.apiKey);
      setModel(stored.model);
      setSavedSuccess(false);
      setQaError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!apiKey.trim()) {
      setQaError('请输入有效的 API-Key！所有大模型调用均需要输入 API-Key 才能调用。');
      return;
    }

    saveLLMConfig(apiKey, model);
    setSavedSuccess(true);
    setQaError('');

    if (onConfigSaved) {
      onConfigSaved({ apiKey: apiKey.trim(), model });
    }

    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5DFD3] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#2D2A26] text-white p-6 rounded-t-3xl flex items-center justify-between border-b border-[#403C37]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#7D8E7E] rounded-xl text-white">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                大模型配置与引擎选择 (LLM Engine Settings)
              </h3>
              <p className="text-xs text-[#D6C7B2]">
                部署至 GitHub / Netlify 浏览器环境，绑定个人 API-Key 即可使用
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#D6C7B2] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner if passed */}
        {initialNotice && (
          <div className="mx-6 mt-4 p-3 bg-[#FDF6F0] border border-[#E8C8BE] text-[#8C4332] rounded-2xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C99B8B]" />
            <span>{initialNotice}</span>
          </div>
        )}

        {/* Main Form Content */}
        <div className="p-6 space-y-6">
          
          {/* 1. 手工输入 API-Key */}
          <div className="space-y-2 bg-[#F9F7F2] p-4.5 rounded-2xl border border-[#E5DFD3]">
            <label className="text-xs font-bold text-[#5A6354] flex items-center space-x-2">
              <Key className="w-4 h-4 text-[#7D8E7E]" />
              <span>1. 手工输入 API-Key (API Key Required)</span>
            </label>
            <p className="text-[11px] text-[#8C8476]">
              在 GitHub Pages / Netlify 浏览器直接调用大模型时，请输入您的个人 API-Key（支持 Gemini API Key 或 DeepSeek API Key）。 Key 仅保存在本地浏览器，不会上传任何服务器。
            </p>
            <div className="relative flex items-center mt-2">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="例如：AIzaSy... (Gemini Key) 或 sk-... (DeepSeek Key)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-xs bg-white border border-[#D6C7B2] rounded-xl px-3 py-2.5 pr-10 text-[#2D2A26] font-mono focus:outline-hidden focus:border-[#7D8E7E]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-[#8C8476] hover:text-[#2D2A26] cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. 选择两个大模型 */}
          <div className="space-y-2 bg-[#F9F7F2] p-4.5 rounded-2xl border border-[#E5DFD3]">
            <label className="text-xs font-bold text-[#5A6354] flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#7D8E7E]" />
              <span>2. 选择大模型引擎 (Select Model)</span>
            </label>
            <p className="text-[11px] text-[#8C8476]">
              请选择本次报告生成与统计推断问答使用的大模型：
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Option 1: Gemini 3.6 Flash */}
              <div
                onClick={() => setModel('gemini-3.6-flash')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  model === 'gemini-3.6-flash'
                    ? 'bg-[#F4F7F4] border-[#7D8E7E] shadow-2xs'
                    : 'bg-white border-[#E5DFD3] hover:border-[#7D8E7E]/50'
                }`}
              >
                <input
                  type="radio"
                  name="llm_model"
                  checked={model === 'gemini-3.6-flash'}
                  onChange={() => setModel('gemini-3.6-flash')}
                  className="mt-0.5 text-[#7D8E7E]"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#3D3D3D]">Gemini 3.6 Flash</div>
                  <div className="text-[10px] text-[#7A7267]">
                    Google 官方 Flash 高速推演模型，精通 APA 学术规范与效应量分析
                  </div>
                </div>
              </div>

              {/* Option 2: DeepSeek V4 Pro */}
              <div
                onClick={() => setModel('deepseek-v4-pro')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  model === 'deepseek-v4-pro'
                    ? 'bg-[#F4F7F4] border-[#7D8E7E] shadow-2xs'
                    : 'bg-white border-[#E5DFD3] hover:border-[#7D8E7E]/50'
                }`}
              >
                <input
                  type="radio"
                  name="llm_model"
                  checked={model === 'deepseek-v4-pro'}
                  onChange={() => setModel('deepseek-v4-pro')}
                  className="mt-0.5 text-[#7D8E7E]"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#3D3D3D]">DeepSeek V4 Pro</div>
                  <div className="text-[10px] text-[#7A7267]">
                    深度求索逻辑推理模型，擅长复杂假设检验推导与通俗比喻
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 确认大模型 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F2EDE4] p-4 rounded-2xl border border-[#E5DFD3]">
            <div className="text-xs text-[#5A6354]">
              {savedSuccess ? (
                <span className="text-[#3D523E] font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#7D8E7E]" />
                  <span>配置已保存！支持在浏览器使用选定模型。</span>
                </span>
              ) : (
                <span>完成设置后，请点击右侧“确认保存”生效。</span>
              )}
            </div>

            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>3. 确认大模型配置</span>
            </button>
          </div>

          {/* Error Message if any */}
          {qaError && (
            <div className="p-3 bg-[#FDF6F0] border border-[#E8C8BE] text-[#8C4332] rounded-xl text-xs">
              {qaError}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
