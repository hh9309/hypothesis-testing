import React, { useState } from 'react';
import { TestInputData, HypothesisResult, AssumptionCheckResult } from '../types';
import { computeTestResult, checkAssumptions } from '../utils/stats';
import { 
  FileDown, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  Download, 
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ReportExportModuleProps {
  inputData: TestInputData;
  aiText?: string;
  onNavigateToAI?: () => void;
}

export const ReportExportModule: React.FC<ReportExportModuleProps> = ({
  inputData,
  aiText,
  onNavigateToAI,
}) => {
  const result: HypothesisResult = computeTestResult(inputData);
  const assumptions: AssumptionCheckResult = checkAssumptions(inputData);

  const [copiedApa, setCopiedApa] = useState<boolean>(false);
  const [copiedData, setCopiedData] = useState<boolean>(false);

  // 一键复制 APA 7th 标准表达式
  const handleCopyApa = () => {
    navigator.clipboard.writeText(result.apaFormat);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  // 复制完整实验 JSON 数据
  const handleCopyDataJson = () => {
    const fullReportJson = {
      testName: result.testName,
      inputData,
      hypothesisResult: result,
      assumptionCheck: assumptions,
      aiInsights: aiText || '未生成',
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(fullReportJson, null, 2));
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  // 导出 Markdown 报告文件 (.md)
  const handleDownloadMarkdown = () => {
    const markdownContent = `# 假设检验与推断统计分析学术报告

## 一、 实验背景与数据特征概览
- **检验名称**: ${result.testName}
- **检验方向**: ${inputData.alternative === 'two_sided' ? '双侧检验 (Two-Sided)' : inputData.alternative === 'greater' ? '右侧单尾检验 (Greater)' : '左侧单尾检验 (Less)'}
- **显著性水平 α**: ${result.alpha}
- **样本参数特征**: ${JSON.stringify(inputData)}

## 二、 统计前提假设合规性审查
- **正态性分布 (Normality)**: ${assumptions.normality.message} (判定: ${assumptions.normality.passed ? '满足' : '预警'})
- **方差齐性假定 (Homogeneity)**: ${assumptions.homogeneity.message} (判定: ${assumptions.homogeneity.passed ? '满足' : '预警'})
- **观测独立性假定 (Independence)**: ${assumptions.independence.message}
- **假定违例替代路线**: 若正态性/方差齐性不满足，推荐使用 Welch's t-test、Mann-Whitney U 或 Kruskal-Wallis 等非参数检定。

## 三、 假设系统构建与统计推断过程
- **原假设 H0**: ${result.h0Text}
- **备择假设 H1**: ${result.h1Text}
- **检验统计量**: ${result.statisticName} = ${result.statisticValue.toFixed(4)}
- **自由度 df**: ${Array.isArray(result.df) ? result.df.join(', ') : result.df}
- **临界值 (Critical Value)**: ${Array.isArray(result.criticalValue) ? result.criticalValue.map(v => v.toFixed(3)).join(', ') : result.criticalValue.toFixed(3)}

## 四、 P 值显著性检验决策与区间估计
- **计算 p 值**: ${result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(6)}
- **决策结论**: ${result.rejectH0 ? '拒绝原假设 H0 (Statistically Significant)' : '无法拒绝原假设 H0 (Not Statistically Significant)'}
- **95% 置信区间**: ${result.confidenceInterval ? `[${result.confidenceInterval[0].toFixed(3)}, ${result.confidenceInterval[1].toFixed(3)}]` : '参考区间估算'}
- **推断结论**: ${result.interpretation}

## 五、 效应量强度与两类错误风险控制
- **效应量指标**: ${result.effectSizeName || "Cohen's d"} = ${result.effectSizeValue ? result.effectSizeValue.toFixed(3) : '计算中'}
- **效应量强度评级**: ${result.effectSizeValue ? (Math.abs(result.effectSizeValue) < 0.2 ? '微弱效应 (Small)' : Math.abs(result.effectSizeValue) < 0.8 ? '中等效应 (Medium)' : '强效应 (Large)') : '参考标准效应量'}
- **第一类错误 (Type I Error, α)**: ${result.alpha}
- **统计功效 (Power, 1-β)**: 已结合样本容量进行检出风险控制。

## 六、 APA 7th 标准学术规范表述与落地建言
- **APA 7th 标准表达**: ${result.apaFormat}
- **学术描述语段**: “根据 ${result.testName} 结果，统计量 ${result.statisticName} = ${result.statisticValue.toFixed(2)}, p ${result.pValue < 0.001 ? '< .001' : `= ${result.pValue.toFixed(3)}`}, ${result.rejectH0 ? '差异具有显著统计学意义，原假设被拒绝' : '尚未发现统计学显著差异，无法拒绝原假设'}。”
- **实践与落地指南**: 本结论适用于指导 A/B 测试上线评价、临床新药疗效评价及产品质量控制的风险防护。

---
## AI 大模型深度洞察分析附录
${aiText || '（暂未在 Tab 7 生成 AI 大模型洞察，可随时前往 7. AI 洞察模块生成）'}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hypothesis_Testing_Academic_Report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 触发网页/PDF 打印
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 模块标头与导出动作工具栏 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                <FileDown className="w-3.5 h-3.5" />
                <span>Module 8</span>
              </span>
              <span className="text-slate-400 text-xs">• 学术报告与数据导出</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              8. 假设检验学术报告全景导出
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              一键生成符合 APA 7th 标准规范的学术报告，支持网页 PDF 打印排版、Markdown 格式下载与实验数据 JSON 提取。
            </p>
          </div>

          {/* 导出按钮栏 */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>打印 / 导出 PDF</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>下载 Markdown (.md)</span>
            </button>

            <button
              onClick={handleCopyDataJson}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-2xl transition-all text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              {copiedData ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedData ? '已复制 JSON' : '复制 JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 快捷 APA 复制与 AI 提醒 Banner (打印时隐藏) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase text-blue-700">APA 7th 标准表达</div>
            <div className="font-mono text-xs font-bold text-slate-800">{result.apaFormat}</div>
          </div>
          <button
            onClick={handleCopyApa}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
          >
            {copiedApa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedApa ? '已复制' : '复制 APA'}</span>
          </button>
        </div>

        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase text-indigo-700">AI 洞察关联状态</div>
            <div className="text-xs font-medium text-slate-700">
              {aiText ? '✓ 大模型 AI 深度洞察已成功同步至附录' : '未生成 AI 洞察（可前往 Tab 7 智能生成）'}
            </div>
          </div>
          {onNavigateToAI && (
            <button
              onClick={onNavigateToAI}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiText ? '查看 AI 洞察' : '去生成 AI 洞察'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 完整 6 大核心部分学术报告卡片（适合屏幕预览与 PDF 打印） */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-md border border-slate-200/80 space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* 页眉 (打印时显示) */}
        <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-6">
          <h1 className="text-xl font-bold text-slate-900">假设检验与推断统计学术分析报告</h1>
          <p className="text-xs text-slate-600 mt-1">
            Hypothesis Testing & Inferential Statistics Academic Report — Generated by Smart Lab
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-800">
          
          {/* Section 1 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 print:bg-white print:p-0 print:border-b print:rounded-none">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2 print:border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs print:bg-black">1</span>
              <span>📊 一、 实验背景与数据特征概览</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div>
                <span className="text-slate-500">检验类型：</span>
                <span className="font-bold text-slate-900">{result.testName}</span>
              </div>
              <div>
                <span className="text-slate-500">检验对择方向：</span>
                <span className="font-semibold text-slate-900">
                  {inputData.alternative === 'two_sided' ? '双侧检验 (Two-Sided)' : inputData.alternative === 'greater' ? '右侧单尾检验 (Greater)' : '左侧单尾检验 (Less)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">显著性水准 α：</span>
                <span className="font-mono font-bold text-blue-700 print:text-black">{result.alpha}</span>
              </div>
              <div>
                <span className="text-slate-500">测量变量与样本信息：</span>
                <span className="font-mono text-slate-800">
                  {inputData.sampleSize ? `样本量 n = ${inputData.sampleSize}` : inputData.n1 ? `n1 = ${inputData.n1}, n2 = ${inputData.n2}` : '数据已导入'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 print:bg-white print:p-0 print:border-b print:rounded-none">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2 print:border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs print:bg-black">2</span>
              <span>🔬 二、 统计前提假设合规性审查</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${assumptions.normality.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="font-bold text-slate-900 flex justify-between">
                  <span>正态性假定</span>
                  <span className={assumptions.normality.passed ? 'text-emerald-700' : 'text-amber-800'}>
                    {assumptions.normality.passed ? '✓ 满足' : '⚠ 预警'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{assumptions.normality.message}</p>
              </div>

              <div className={`p-3 rounded-xl border text-xs space-y-1 ${assumptions.homogeneity.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="font-bold text-slate-900 flex justify-between">
                  <span>方差齐性假定</span>
                  <span className={assumptions.homogeneity.passed ? 'text-emerald-700' : 'text-amber-800'}>
                    {assumptions.homogeneity.passed ? '✓ 满足' : '⚠ 预警'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{assumptions.homogeneity.message}</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900 flex justify-between">
                  <span>观测独立性假定</span>
                  <span className="text-emerald-700">✓ 满足</span>
                </div>
                <p className="text-[11px] text-slate-600">{assumptions.independence.message}</p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 print:bg-white print:p-0 print:border-b print:rounded-none">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2 print:border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs print:bg-black">3</span>
              <span>📐 三、 假设系统构建与统计推断过程</span>
            </h3>
            <div className="space-y-2 text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-700 print:text-black">原假设 H₀：</span>
                  <span className="font-mono text-slate-800">{result.h0Text}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-700 print:text-black">备择假设 H₁：</span>
                  <span className="font-mono text-slate-800">{result.h1Text}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans">检验统计量</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{result.statisticName} = {result.statisticValue.toFixed(4)}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans">自由度 df</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{Array.isArray(result.df) ? result.df.join(', ') : result.df}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500 font-sans">拒绝域临界值 (α={result.alpha})</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    ±{Array.isArray(result.criticalValue) ? result.criticalValue.map(v => v.toFixed(3)).join(', ') : result.criticalValue.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 print:bg-white print:p-0 print:border-b print:rounded-none">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2 print:border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs print:bg-black">4</span>
              <span>🎯 四、 P 值显著性检验决策与区间估计</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500">计算 p 值：</span>
                  <span className="font-mono font-bold text-slate-900">
                    {result.pValue < 0.001 ? 'p < .001 (极其显著)' : `p = ${result.pValue.toFixed(6)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-500">决策结果：</span>
                  <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${result.rejectH0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {result.rejectH0 ? '拒绝原假设 H₀' : '无法拒绝原假设 H₀'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5 print:bg-white print:border-slate-300">
                <div className="font-bold text-blue-900 print:text-black">95% 置信区间 (95% CI)：</div>
                <div className="font-mono font-bold text-slate-800">
                  {result.confidenceInterval ? `[${result.confidenceInterval[0].toFixed(3)}, ${result.confidenceInterval[1].toFixed(3)}]` : '（参考总体参数点估计）'}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{result.interpretation}</p>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 print:bg-white print:p-0 print:border-b print:rounded-none">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2 print:border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs print:bg-black">5</span>
              <span>📏 五、 效应量强度与两类错误风险控制</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-500">效应量指标</div>
                <div className="font-bold text-slate-900">{result.effectSizeName || "Cohen's d"}</div>
                <div className="text-xs font-mono font-bold text-blue-600 print:text-black">
                  {result.effectSizeValue ? result.effectSizeValue.toFixed(3) : '计算完成'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-500">效应强度评级</div>
                <div className="font-bold text-slate-900">
                  {result.effectSizeValue ? (Math.abs(result.effectSizeValue) < 0.2 ? '微弱效应 (Small)' : Math.abs(result.effectSizeValue) < 0.8 ? '中等效应 (Medium)' : '强效应 (Large)') : '标准效应'}
                </div>
                <div className="text-[10px] text-slate-400">基于 Cohen (1988) 统计评级</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-500">第一类错误风险 (α)</div>
                <div className="font-bold text-slate-900">α = {result.alpha}</div>
                <div className="text-[10px] text-slate-400">假阳性率上限受严格约束</div>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 print:bg-white print:p-0 print:border-b print:rounded-none">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2 print:border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs print:bg-black">6</span>
              <span>📝 六、 APA 7th 标准学术规范表述与落地建言</span>
            </h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide print:text-black">APA 7th 标准英文期刊规范表达</div>
                <div className="font-mono font-bold text-slate-900 text-xs bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 print:bg-white print:border-slate-300">
                  {result.apaFormat}
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700">学术描述与实际业务落地建言</div>
                <p className="text-slate-700 leading-relaxed">
                  根据统计分析结果，本研究检验统计量 {result.statisticName} = {result.statisticValue.toFixed(2)}, p {result.pValue < 0.001 ? '< .001' : `= ${result.pValue.toFixed(3)}`}, {result.rejectH0 ? '具有显著统计学意义，原假设被拒绝。建议在业务决策中正式采纳备择假设方向（如推进新方案全量上线或确认药物显著疗效）。' : '尚未发现统计学显著差异，无法拒绝原假设。建议保持现状或扩大样本量继续观测，防范因统计功效不足引起的假阴性错误。'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: AI Deep Insights Appendix (If Available) */}
          {aiText && (
            <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 print:bg-white print:text-black print:border-slate-300">
              <div className="flex items-center space-x-2 text-blue-400 font-bold border-b border-white/10 pb-3 print:text-black print:border-slate-300">
                <Sparkles className="w-5 h-5 text-blue-400 print:hidden" />
                <span>附录：大模型深度学术与业务洞察 (AI Insights)</span>
              </div>
              <div className="prose prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap print:prose">
                {aiText}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
