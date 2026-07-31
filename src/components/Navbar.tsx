import React from 'react';
import { ModuleTab } from '../types';
import { 
  BookOpen, 
  GitFork, 
  PlayCircle, 
  Sliders, 
  FileText, 
  Terminal, 
  Sparkles,
  FileDown,
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  activeTab: ModuleTab;
  setActiveTab: (tab: ModuleTab) => void;
  onResetAll?: () => void;
  onOpenGlossary?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onResetAll, onOpenGlossary }) => {
  const tabs: { id: ModuleTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'guide', label: '1. 知识引导', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'taxonomy', label: '2. 决策树', icon: <GitFork className="w-4 h-4" /> },
    { id: 'sandbox', label: '3. 5步沙盒', icon: <PlayCircle className="w-4 h-4" /> },
    { id: 'distribution', label: '4. 分布与错误博弈', icon: <Sliders className="w-4 h-4" /> },
    { id: 'cases', label: '5. 经典案例', icon: <FileText className="w-4 h-4" /> },
    { id: 'python', label: '6. Python 验证', icon: <Terminal className="w-4 h-4" /> },
    { id: 'ai', label: '7. AI 洞察', icon: <Sparkles className="w-4 h-4" />, badge: 'AI' },
    { id: 'report', label: '8. 报告导出', icon: <FileDown className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('guide')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-xl">
              ∑
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                  假设检验与推断统计智能实验室
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Hypothesis Testing & Inferential Statistics Smart Lab
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2">
            {onOpenGlossary && (
              <button
                onClick={onOpenGlossary}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                title="打开统计学术语与物理含义词典"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>术语 AI 词典</span>
              </button>
            )}

            {onResetAll && (
              <button
                onClick={onResetAll}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                title="重置所有参数"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 pt-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
