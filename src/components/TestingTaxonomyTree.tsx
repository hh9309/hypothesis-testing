import React, { useState } from 'react';
import { SpecificTestType, TestCategory, TestInputData, ModuleTab } from '../types';
import { 
  GitFork, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Layers, 
  Sliders, 
  Database,
  Search
} from 'lucide-react';

interface TestingTaxonomyTreeProps {
  onSelectTest: (testType: SpecificTestType, defaultInputData?: Partial<TestInputData>) => void;
  onNavigate: (tab: ModuleTab) => void;
}

export const TestingTaxonomyTree: React.FC<TestingTaxonomyTreeProps> = ({ onSelectTest, onNavigate }) => {
  // 决策树问答状态
  const [step1DataType, setStep1DataType] = useState<'numeric' | 'categorical' | null>(null);
  const [step2NumGroups, setStep2NumGroups] = useState<'one' | 'two' | 'multi' | null>(null);
  const [step3IsPaired, setStep3IsPaired] = useState<boolean | null>(null);
  const [step4SampleVarKnown, setStep4SampleVarKnown] = useState<'known' | 'unknown_large' | 'unknown_small' | null>(null);

  // 展开的分类卡片
  const [activeCategory, setActiveCategory] = useState<TestCategory>('t_test');

  // 计算推荐的检验类型
  const getRecommendedTest = (): SpecificTestType | null => {
    if (step1DataType === 'categorical') {
      if (step2NumGroups === 'one') return 'chi2_gof';
      return 'chi2_independence';
    }

    if (step1DataType === 'numeric') {
      if (step2NumGroups === 'multi') return 'f_anova_one_way';

      if (step2NumGroups === 'one') {
        if (step4SampleVarKnown === 'known' || step4SampleVarKnown === 'unknown_large') return 'z_one_sample';
        return 't_one_sample';
      }

      if (step2NumGroups === 'two') {
        if (step3IsPaired) return 't_paired';
        if (step4SampleVarKnown === 'known' || step4SampleVarKnown === 'unknown_large') return 'z_two_sample';
        return 't_two_sample_ind';
      }
    }

    return null;
  };

  const recommendedTest = getRecommendedTest();

  // 重置问答
  const handleResetWizard = () => {
    setStep1DataType(null);
    setStep2NumGroups(null);
    setStep3IsPaired(null);
    setStep4SampleVarKnown(null);
  };

  const handleApplyAndJump = (type: SpecificTestType) => {
    onSelectTest(type);
    onNavigate('sandbox');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-2">
        <div className="flex items-center space-x-2 text-[#7D8E7E]">
          <GitFork className="w-6 h-6" />
          <h2 className="text-xl font-bold text-[#5A6354]">
            检验类别与智能决策树 (Testing Taxonomy & Tree)
          </h2>
        </div>
        <p className="text-xs text-[#7A7267]">
          面对复杂多变的数据，如何准确选择最适配的统计检验？通过交互问答或分类树形节点，精准定位 4 大类假设检验。
        </p>
      </div>

      {/* Grid: Interactive Wizard vs Tree Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Wizard */}
        <div className="lg:col-span-5 bg-[#2D2A26] rounded-3xl p-6 text-white space-y-6 shadow-sm border border-[#403C37]">
          <div className="flex items-center justify-between border-b border-[#403C37] pb-3">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-[#A8C3A9]" />
              <h3 className="text-base font-bold text-white">智能检验匹配问卷 (Wizard)</h3>
            </div>
            <button
              onClick={handleResetWizard}
              className="text-xs text-[#A89F91] hover:text-[#D6C7B2] transition-colors cursor-pointer"
            >
              重新推演
            </button>
          </div>

          {/* Question 1 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#D4D4D4] block">
              Q1. 您要分析的因变量数据类型是什么？
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setStep1DataType('numeric');
                  setStep2NumGroups(null);
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  step1DataType === 'numeric'
                    ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                    : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                }`}
              >
                <div className="font-semibold">数值型数据 (Continuous)</div>
                <div className="text-[10px] text-[#A89F91] mt-0.5">例如：身高、血压、销售额、考试得分</div>
              </button>

              <button
                onClick={() => {
                  setStep1DataType('categorical');
                  setStep2NumGroups(null);
                }}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  step1DataType === 'categorical'
                    ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                    : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                }`}
              >
                <div className="font-semibold">分类/比例数据 (Discrete)</div>
                <div className="text-[10px] text-[#A89F91] mt-0.5">例如：性别、满意度等级、是否转化</div>
              </button>
            </div>
          </div>

          {/* Question 2 */}
          {step1DataType && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-[#D4D4D4] block">
                Q2. 您参与比较或检验的组数/样本数？
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => setStep2NumGroups('one')}
                  className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                    step2NumGroups === 'one'
                      ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                      : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                  }`}
                >
                  单样本 / 整体
                </button>
                <button
                  onClick={() => setStep2NumGroups('two')}
                  className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                    step2NumGroups === 'two'
                      ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                      : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                  }`}
                >
                  双样本比较
                </button>
                <button
                  onClick={() => setStep2NumGroups('multi')}
                  className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                    step2NumGroups === 'multi'
                      ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                      : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                  }`}
                >
                  3 组及以上
                </button>
              </div>
            </div>
          )}

          {/* Question 3 */}
          {step1DataType === 'numeric' && step2NumGroups === 'two' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-[#D4D4D4] block">
                Q3. 两个样本是否为配对/重复测量关系？
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setStep3IsPaired(true)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    step3IsPaired === true
                      ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                      : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                  }`}
                >
                  是 (同一批受试者前后测量)
                </button>
                <button
                  onClick={() => setStep3IsPaired(false)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    step3IsPaired === false
                      ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                      : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                  }`}
                >
                  否 (两个独立受试者群体)
                </button>
              </div>
            </div>
          )}

          {/* Question 4 */}
          {step1DataType === 'numeric' && (step2NumGroups === 'one' || (step2NumGroups === 'two' && step3IsPaired === false)) && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-[#D4D4D4] block">
                Q4. 总体方差 σ² 是否已知，或样本量 n 大小？
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setStep4SampleVarKnown('unknown_small')}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    step4SampleVarKnown === 'unknown_small'
                      ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                      : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                  }`}
                >
                  方差未知 且 小样本 (n &lt; 30)
                </button>
                <button
                  onClick={() => setStep4SampleVarKnown('unknown_large')}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    step4SampleVarKnown === 'unknown_large'
                      ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                      : 'bg-[#3D3A36] border-[#504C46] text-[#D4D4D4] hover:bg-[#4A4640]'
                  }`}
                >
                  方差已知 或 大样本 (n ≥ 30)
                </button>
              </div>
            </div>
          )}

          {/* Recommendation Output Box */}
          {recommendedTest && (
            <div className="p-4 rounded-2xl bg-[#7D8E7E]/20 border border-[#7D8E7E] space-y-3 animate-fade-in">
              <div className="text-xs text-[#A8C3A9] font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7D8E7E]" />
                <span>智能决策引擎推荐检验法：</span>
              </div>
              <div className="text-lg font-extrabold text-white">
                {recommendedTest === 't_one_sample' && '单样本 t 检验 (One-Sample t-Test)'}
                {recommendedTest === 't_two_sample_ind' && '独立双样本 t 检验 (Independent t-Test)'}
                {recommendedTest === 't_paired' && '配对样本 t 检验 (Paired t-Test)'}
                {recommendedTest === 'z_one_sample' && '单样本 Z 检验 (One-Sample Z-Test)'}
                {recommendedTest === 'z_two_sample' && '独立双样本 Z 检验 (Two-Sample Z-Test)'}
                {recommendedTest === 'chi2_independence' && '卡方独立性检验 (Chi-Square Independence Test)'}
                {recommendedTest === 'chi2_gof' && '卡方拟合优度检验 (Chi-Square Goodness-of-Fit)'}
                {recommendedTest === 'f_anova_one_way' && '单因素方差分析 (One-Way ANOVA)'}
              </div>
              <button
                onClick={() => handleApplyAndJump(recommendedTest)}
                className="w-full py-2.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
              >
                <span>将此推荐载入 5 步沙盒</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Taxonomy Node Explorer */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 't_test', label: 't 检验类', sub: '小样本均值' },
              { id: 'z_test', label: 'Z 检验类', sub: '大样本/方差已知' },
              { id: 'chi2_test', label: '卡方 χ² 类', sub: '分类数据独立/拟合' },
              { id: 'f_test', label: 'F 检验类', sub: '方差齐性与 ANOVA' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as TestCategory)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-white border-[#7D8E7E] shadow-sm ring-2 ring-[#7D8E7E]/20 text-[#5A6354]'
                    : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#7A7267] hover:bg-white'
                }`}
              >
                <div className="text-xs font-bold text-[#5A6354]">{cat.label}</div>
                <div className="text-[10px] text-[#8C8476] mt-0.5">{cat.sub}</div>
              </button>
            ))}
          </div>

          {/* Detailed Node Cards for Selected Category */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-4">
            {activeCategory === 't_test' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#5A6354]">1. t 检验全族 (t-Test Family)</h4>
                  <span className="text-xs text-[#7D8E7E] font-semibold bg-[#F2EDE4] px-2 py-0.5 rounded-md border border-[#E5DFD3]">
                    适用于小样本 (n &lt; 30) 且总体方差未知
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">单样本 t 检验 (One-Sample t-Test)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">比较单一小样本均值是否显著偏离已知常数 μ₀。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('t_one_sample')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">独立双样本 t 检验 (Independent Samples t-Test)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">比较两个互不相干的独立受试组（如对照组 vs 实验组）的均值差异。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('t_two_sample_ind')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">配对样本 t 检验 (Paired Samples t-Test)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">比较同一组受试者在干预前后（Pre-Post）的重复测量均值改变量。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('t_paired')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'z_test' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#5A6354]">2. Z 检验族 (Z-Test Family)</h4>
                  <span className="text-xs text-[#7D8E7E] font-semibold bg-[#F2EDE4] px-2 py-0.5 rounded-md border border-[#E5DFD3]">
                    适用于大样本 (n ≥ 30) 或总体方差已知
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">单样本 Z 检验 (One-Sample Z-Test)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">当总体标准差 σ 已知或大样本时，检验样本均值与总体均值。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('z_one_sample')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">双比例 Z 检验 (Two-Proportion Z-Test)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">比较两个独立样本在二项分布转化率（如 A/B 测试点击率）上的比例差。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('z_proportion_two')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'chi2_test' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#5A6354]">3. 卡方检验族 (Chi-Square Family)</h4>
                  <span className="text-xs text-[#5A6354] font-semibold bg-[#F2EDE4] px-2 py-0.5 rounded-md border border-[#E5DFD3]">
                    非参数检验 · 用于分类数据与频数频度分析
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">卡方独立性检验 (Chi-Square Independence Test)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">评估列联表 (Contingency Table) 中两个分类变量之间是否存在显著关联。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('chi2_independence')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'f_test' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#5A6354]">4. F 检验与方差分析族 (F-Test & ANOVA)</h4>
                  <span className="text-xs text-[#7D8E7E] font-semibold bg-[#F2EDE4] px-2 py-0.5 rounded-md border border-[#E5DFD3]">
                    用于方差波动比较与 3 组及以上多组均值比较
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">双样本方差比 F 检验 (F-Test for Variances)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">评估两个正态样本的总体方差是否相等（即方差齐性）。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('f_two_variance')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#E5DFD3] hover:border-[#D6C7B2] transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#5A6354]">单因素方差分析 (One-Way ANOVA)</div>
                      <p className="text-[11px] text-[#7A7267] mt-0.5">将总变异拆解为“组间变异”与“组内变异”，一次性比较 3 组或更多组均值。</p>
                    </div>
                    <button
                      onClick={() => handleApplyAndJump('f_anova_one_way')}
                      className="px-3 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>去运行</span>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
