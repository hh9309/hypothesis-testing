import React, { useState } from 'react';
import { Search, BookOpen, X, Sparkles, Filter, Lightbulb, ChevronRight } from 'lucide-react';
import { STAT_TERMS_DATABASE, StatTermDefinition } from '../data/statTerms';
import { StatTerm } from './StatTerm';

interface StatGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatGlossaryModal: React.FC<StatGlossaryModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  if (!isOpen) return null;

  const categories = ['全部', '核心概念', '统计指标', '前提假定', '检验方法'];

  const filteredTerms = STAT_TERMS_DATABASE.filter((term) => {
    const matchesCat = selectedCategory === '全部' || term.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      term.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.quickDef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-[#E5DFD3] overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2D2A26] p-6 text-white flex items-center justify-between border-b border-[#403C37]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7D8E7E]/30 flex items-center justify-center text-[#A8BBA9]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>推断统计学学术术语与物理含义词典</span>
                <span className="text-xs font-normal bg-[#7D8E7E]/30 text-[#D6C7B2] px-2 py-0.5 rounded-md border border-[#7D8E7E]/40">
                  AI 双向直觉速查
                </span>
              </h2>
              <p className="text-xs text-[#A69C8D] mt-0.5">
                鼠标悬停或点击任意术语，即可查看通俗物理比喻、数学判别法则与 AI 实时洞察。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#A69C8D] hover:text-white hover:bg-[#403C37] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-[#F9F7F2] border-b border-[#E5DFD3] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C8476] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索统计术语 (如：自由度、方差齐性、置信区间、p值、显著性水平...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5DFD3] rounded-xl pl-9 pr-4 py-2 text-xs text-[#3D3D3D] focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8476] hover:text-[#3D3D3D]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#7D8E7E] text-white shadow-2xs'
                    : 'bg-white border border-[#E5DFD3] text-[#5A6354] hover:bg-[#F2EDE4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Term Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTerms.length > 0 ? (
            filteredTerms.map((t) => (
              <div
                key={t.id}
                className="p-4 bg-white rounded-2xl border border-[#E5DFD3] hover:border-[#7D8E7E] transition-all shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <StatTerm term={t.id} inline={false} showSparkle className="text-xs font-bold text-[#3D3D3D]">
                      {t.name}
                    </StatTerm>
                    <span className="text-[10px] font-mono font-bold bg-[#F2EDE4] text-[#7A7267] px-2 py-0.5 rounded-md border border-[#E5DFD3]">
                      {t.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#5A6354] leading-relaxed">
                    {t.quickDef}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F2EDE4] flex items-center justify-between text-[11px] text-[#7A7267]">
                  <span className="flex items-center gap-1 font-medium text-[#7D8E7E]">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>有通俗物理比喻</span>
                  </span>

                  <StatTerm term={t.id} inline={false} className="text-[11px] font-bold text-[#7D8E7E]">
                    查看 AI 深度解读 →
                  </StatTerm>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-[#8C8476] space-y-2">
              <BookOpen className="w-8 h-8 text-[#D6C7B2] mx-auto" />
              <p className="text-xs font-bold">未找到与 “{searchQuery}” 匹配的统计术语</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9F7F2] border-t border-[#E5DFD3] flex items-center justify-between text-xs text-[#8C8476]">
          <span>全站支持在任意算式或结论处点击术语进行物理查阅</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7D8E7E] text-white font-bold rounded-xl hover:bg-[#6C7D6D] transition-colors cursor-pointer"
          >
            完成查阅
          </button>
        </div>
      </div>
    </div>
  );
};
