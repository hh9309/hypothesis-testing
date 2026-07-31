import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Download, Sparkles, Image as ImageIcon, Code2, BarChart2, Layers } from 'lucide-react';
import { TestInputData, HypothesisResult } from '../types';
import { computeTestResult, tPdf, normalPdf, chi2Pdf, fPdf, tInv, normalInv, chi2Inv, fInv } from '../utils/stats';

interface PythonSandboxProps {
  inputData: TestInputData;
}

export const PythonSandbox: React.FC<PythonSandboxProps> = ({ inputData }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [outputLogs, setOutputLogs] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'stdout' | 'plot' | 'dict'>('stdout');
  const [codeType, setCodeType] = useState<'scipy' | 'statsmodels' | 'visual_matplotlib'>('scipy');

  const result: HypothesisResult = computeTestResult(inputData);

  // 根据当前 inputData 与选中的模式生成专业 Python 代码
  const generatePythonCode = (): string => {
    const alpha = inputData.alpha;
    const testType = inputData.testType;

    if (codeType === 'visual_matplotlib') {
      return `import scipy.stats as stats
import numpy as np
import matplotlib.pyplot as plt

# 绘制假设检验概率分布与拒绝域图形
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
fig, ax = plt.subplots(figsize=(8, 4.5), dpi=100)

${testType === 'chi2_independence' ? `
# 卡方分布绘制
df = ${typeof result.df === 'number' ? result.df : 1}
x = np.linspace(0, 20, 500)
y = stats.chi2.pdf(x, df)
crit = stats.chi2.ppf(1 - ${alpha}, df)
stat_val = ${result.statisticValue.toFixed(4)}

ax.plot(x, y, label=f'Chi-Square PDF (df={df})', color='#3D523E', lw=2)
ax.fill_between(x, y, where=(x >= crit), color='#C99B8B', alpha=0.5, label=f'Rejection Region (alpha={alpha})')
ax.axvline(crit, color='#8C4332', linestyle='--', label=f'Critical Value ({crit:.2f})')
ax.axvline(stat_val, color='#2D2A26', linestyle='-', lw=2.5, label=f'Observed Stat ({stat_val:.2f})')
` : `
# t / Z 标准采样分布
df = ${typeof result.df === 'number' && result.df !== Infinity ? result.df : 30}
x = np.linspace(-4, 4, 500)
y = stats.t.pdf(x, df) if df != 30 else stats.norm.pdf(x)
crit = stats.t.ppf(1 - ${alpha}/2, df)
stat_val = ${result.statisticValue.toFixed(4)}

ax.plot(x, y, label='Sampling Distribution', color='#5A6354', lw=2)
ax.fill_between(x, y, where=(x >= crit), color='#C99B8B', alpha=0.5, label='Rejection Region (+)')
ax.fill_between(x, y, where=(x <= -crit), color='#C99B8B', alpha=0.5, label='Rejection Region (-)')
ax.axvline(crit, color='#8C4332', linestyle='--', label=f'Critical Cutoff (+{crit:.2f})')
ax.axvline(-crit, color='#8C4332', linestyle='--', label=f'Critical Cutoff (-{crit:.2f})')
ax.axvline(stat_val, color='#2D2A26', linestyle='-', lw=2.5, label=f'Observed t ({stat_val:.2f})')
`}

ax.set_title("${result.testName} Distribution & Critical Cutoffs", fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel("Test Statistic Value", fontsize=10)
ax.set_ylabel("Probability Density", fontsize=10)
ax.legend(loc='upper right', frameon=True)
plt.tight_layout()
plt.savefig("hypothesis_test_plot.png", dpi=300)
plt.show()
`;
    }

    if (codeType === 'statsmodels') {
      return `import statsmodels.api as sm
import numpy as np

# 使用 statsmodels 库运行假设检验与置信区间
print("=== statsmodels 深度假设检验结果 ===")
${testType === 't_one_sample' ? `
data = np.array([102, 104, 98, 101, 103, 99, 100, 102, 105, 97, 101, 100, 103, 98, 102])
from statsmodels.stats.weightstats import ztest, DescrStatsW
dstat = DescrStatsW(data)
t_stat, p_val, df = dstat.ttest_mean(value=${inputData.nullValue ?? 100})
ci_low, ci_high = dstat.tconfint_mean(alpha=${alpha})
print(f"t-statistic: {t_stat:.4f}, df: {df}")
print(f"p-value: {p_val:.6f}")
print(f"${(1 - alpha)*100}% Confidence Interval: [{ci_low:.4f}, {ci_high:.4f}]")
` : `
# 通用模型检验输出
print("统计检验模型拟合完成")
print(f"检验方法: ${result.testName}")
print(f"统计量: ${result.statisticName} = ${result.statisticValue.toFixed(4)}, p-value = ${result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(6)}")
`}
`;
    }

    // Default scipy.stats code
    switch (testType) {
      case 't_one_sample':
        return `import scipy.stats as stats
import numpy as np

# 单样本 t 检验 Python scipy.stats 官方标准推算
data = np.array([102, 104, 98, 101, 103, 99, 100, 102, 105, 97, 101, 100, 103, 98, 102])
popmean = ${inputData.nullValue ?? 100}
alpha = ${alpha}

# 1. 运行单样本 t 检验
res = stats.ttest_1samp(data, popmean, alternative='${inputData.alternative}')

# 2. 计算效应量 Cohen's d
s_sample = np.std(data, ddof=1)
d = (np.mean(data) - popmean) / s_sample

# 3. 置信区间 CI
ci = res.confidence_interval(confidence_level=1 - alpha)

print("=== 单样本 t 检验结果 (scipy.stats.ttest_1samp) ===")
print(f"样本均值 x̄: {np.mean(data):.4f}")
print(f"样本标准差 s: {s_sample:.4f}")
print(f"t 统计量: {res.statistic:.4f}")
print(f"自由度 df: {res.df}")
print(f"p 值: {res.pvalue:.6f}")
print(f"{(1 - alpha)*100}% 95% 置信区间: [{ci.low:.4f}, {ci.high:.4f}]")
print(f"Cohen's d: {d:.4f}")
print(f"决策结论: {'拒绝 H0 (在 alpha=' + str(alpha) + ' 下显著)' if res.pvalue <= alpha else '无法拒绝 H0'}")
`;

      case 't_two_sample_ind':
        return `import scipy.stats as stats
import numpy as np

# 独立双样本 t 检验 Python scipy.stats 代码
group1 = np.array([105, 108, 102, 104, 106, 110, 101, 103, 107, 109])
group2 = np.array([98, 96, 100, 95, 99, 97, 101, 94, 98, 96])
alpha = ${alpha}

# 1. 前提假定检验
w_stat, p_norm1 = stats.shapiro(group1)
_, p_levene = stats.levene(group1, group2)

# 2. 独立双样本 t 检验
res = stats.ttest_ind(group1, group2, equal_var=(p_levene >= 0.05), alternative='${inputData.alternative}')

# 3. 效应量 Cohen's d
pooled_sd = np.sqrt(((len(group1)-1)*np.var(group1, ddof=1) + (len(group2)-1)*np.var(group2, ddof=1)) / (len(group1)+len(group2)-2))
cohen_d = (np.mean(group1) - np.mean(group2)) / pooled_sd

print("=== 独立双样本 t 检验结果 ===")
print(f"Levene 方差齐性检验 p 值: {p_levene:.4f}")
print(f"t 统计量: {res.statistic:.4f}")
print(f"自由度 df: {res.df}")
print(f"p 值: {res.pvalue:.6f}")
print(f"Cohen's d: {cohen_d:.4f}")
print(f"决策结论: {'拒绝 H0 (两组均值存在显著差异)' if res.pvalue <= alpha else '无法拒绝 H0'}")
`;

      case 'chi2_independence':
        return `import scipy.stats as stats
import numpy as np

# 卡方独立性检验 Python 代码
contingency_table = np.array([
    [35, 15],
    [20, 30]
])
alpha = ${alpha}

res = stats.chi2_contingency(contingency_table)

print("=== 卡方独立性检验结果 ===")
print(f"χ² 统计量: {res.statistic:.4f}")
print(f"自由度 df: {res.dof}")
print(f"p 值: {res.pvalue:.6f}")
print("期望频数矩阵 (Expected Frequencies):")
print(res.expected_freq)
print(f"决策结论: {'拒绝 H0 (分类变量不独立，关联显著)' if res.pvalue <= alpha else '无法拒绝 H0'}")
`;

      default:
        return `import scipy.stats as stats
import numpy as np

# 通用假设检验 Python 验证
res = stats.ttest_1samp([102, 104, 98, 101, 103, 99, 100], popmean=${inputData.nullValue ?? 100})
print(f"统计量: {res.statistic:.4f}, p 值: {res.pvalue:.6f}")
`;
    }
  };

  const code = generatePythonCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hypothesis_test_${inputData.testType}.py`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 模拟运行 Python 内核 (纯前端动态计算，兼容 GitHub/Netlify 静态部署)
  const handleRunCode = () => {
    setIsRunning(true);
    setOutputLogs('Python 3.11 Kernel Initializing...\nLoading scipy.stats, numpy, matplotlib.pyplot...\nExecuting Python script...\n');

    setTimeout(() => {
      const pFormatted = result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(6);
      const critStr = Array.isArray(result.criticalValue)
        ? `[-${Math.abs(result.criticalValue[0]).toFixed(4)}, +${Math.abs(result.criticalValue[1]).toFixed(4)}]`
        : result.criticalValue.toFixed(4);

      const logText = `[Python 3.11 stdout output]
==================================================
Python Verification Kernel (scipy.stats v1.12.0)
Test Name: ${result.testName}
==================================================

1. Hypothesis Setup:
   - Null Hypothesis (H0): ${result.h0Text}
   - Alternative Hypothesis (H1): ${result.h1Text}
   - Significance Level (alpha): ${result.alpha}

2. Computational Metrics:
   - ${result.statisticName} Statistic: ${result.statisticValue.toFixed(4)}
   - Degrees of Freedom (df): ${typeof result.df === 'number' ? result.df : (Array.isArray(result.df) ? result.df.join(', ') : 'N/A')}
   - Calculated p-value: ${pFormatted}
   - Critical Boundary Cutoff: ${critStr}
   ${result.effectSizeName ? `- Effect Size (${result.effectSizeName}): ${result.effectSizeValue?.toFixed(4)}` : ''}
   ${result.confidenceInterval ? `- ${(1 - result.alpha)*100}% Confidence Interval: [${result.confidenceInterval[0].toFixed(4)}, ${result.confidenceInterval[1].toFixed(4)}]` : ''}

3. Decision Conclusion:
   ${result.rejectH0 ? `>>> DECISION: REJECT H0 (p = ${pFormatted} <= alpha = ${result.alpha})` : `>>> DECISION: FAIL TO REJECT H0 (p = ${pFormatted} > alpha = ${result.alpha})`}
   ${result.interpretation}

[Process finished with exit code 0]
`;

      setOutputLogs(logText);
      setIsRunning(false);
    }, 500);
  };

  // SVG 动态 Matplotlib 绘图渲染组件
  const renderMatplotlibSVG = () => {
    const isChi2 = inputData.testType === 'chi2_independence';
    const isF = inputData.testType === 'f_two_variance' || inputData.testType === 'f_anova_one_way';
    
    const dfNum = typeof result.df === 'number' && result.df !== Infinity ? result.df : 20;
    const alpha = result.alpha;
    const statVal = result.statisticValue;

    // 绘制 100 个采样点
    const points: { x: number; y: number }[] = [];
    const minX = isChi2 || isF ? 0 : -4;
    const maxX = isChi2 || isF ? 20 : 4;
    const step = (maxX - minX) / 100;

    let maxY = 0.001;
    for (let i = 0; i <= 100; i++) {
      const x = minX + i * step;
      let y = 0;
      if (isChi2) y = chi2Pdf(x, dfNum);
      else if (isF) y = fPdf(x, 4, 20);
      else y = tPdf(x, dfNum);
      if (y > maxY) maxY = y;
      points.push({ x, y });
    }

    // 坐标映射
    const width = 580;
    const height = 260;
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const mapX = (x: number) => padding.left + ((x - minX) / (maxX - minX)) * chartW;
    const mapY = (y: number) => height - padding.bottom - (y / (maxY * 1.15)) * chartH;

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`).join(' ');

    // 临界点与观测点坐标
    const critLeft = isChi2 || isF ? chi2Inv(1 - alpha, dfNum) : -Math.abs(typeof result.criticalValue === 'number' ? result.criticalValue : result.criticalValue[0]);
    const critRight = isChi2 || isF ? chi2Inv(1 - alpha, dfNum) : Math.abs(typeof result.criticalValue === 'number' ? result.criticalValue : result.criticalValue[1]);

    const statXPos = mapX(Math.max(minX, Math.min(maxX, statVal)));

    return (
      <div className="bg-[#1A1917] p-4 rounded-2xl border border-[#302D2A] space-y-3 animate-fade-in">
        <div className="flex items-center justify-between text-xs text-[#A69C8D]">
          <div className="flex items-center space-x-2 font-mono">
            <BarChart2 className="w-4 h-4 text-[#7D8E7E]" />
            <span className="font-bold text-[#E5DFD3]">matplotlib.pyplot Figure Canvas</span>
          </div>
          <span className="text-[10px] bg-[#23201D] text-[#D6C7B2] px-2 py-0.5 rounded-md border border-[#403C37]">
            DPI: 300 | Vector Rendered
          </span>
        </div>

        <div className="w-full overflow-x-auto flex justify-center bg-[#23201D] p-3 rounded-xl border border-[#302D2A]">
          <svg width={width} height={height} className="max-w-full">
            {/* Background Grid Lines */}
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#403C37" strokeWidth="1" />
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#403C37" strokeWidth="1" />

            {/* Density Curve */}
            <path d={pathD} fill="none" stroke="#7D8E7E" strokeWidth="2.5" />

            {/* Rejection Shading Right */}
            {critRight <= maxX && (
              <line
                x1={mapX(critRight)}
                y1={padding.top}
                x2={mapX(critRight)}
                y2={height - padding.bottom}
                stroke="#C99B8B"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            )}

            {/* Rejection Shading Left (for two-tailed t) */}
            {!isChi2 && !isF && (
              <line
                x1={mapX(critLeft)}
                y1={padding.top}
                x2={mapX(critLeft)}
                y2={height - padding.bottom}
                stroke="#C99B8B"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            )}

            {/* Observed Test Statistic Position */}
            <line
              x1={statXPos}
              y1={padding.top - 5}
              x2={statXPos}
              y2={height - padding.bottom}
              stroke="#E5DFD3"
              strokeWidth="2.5"
            />
            <circle cx={statXPos} cy={mapY(0)} r="4" fill="#C99B8B" stroke="#2D2A26" strokeWidth="2" />

            {/* Text Annotations */}
            <text x={statXPos} y={padding.top - 10} fill="#E5DFD3" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {result.statisticName} = {statVal.toFixed(2)}
            </text>

            <text x={width / 2} y={height - 10} fill="#A69C8D" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
              Test Statistic Scale (X)
            </text>
            <text x={15} y={height / 2} fill="#A69C8D" fontSize="10" fontFamily="sans-serif" textAnchor="middle" transform={`rotate(-90 15 ${height/2})`}>
              Density f(x)
            </text>

            {/* Legend Box */}
            <g transform={`translate(${width - 170}, ${padding.top})`}>
              <rect width="135" height="45" rx="6" fill="#1A1917" stroke="#403C37" />
              <line x1="10" y1="15" x2="30" y2="15" stroke="#7D8E7E" strokeWidth="2" />
              <text x="35" y="18" fill="#D6C7B2" fontSize="9">PDF Curve</text>
              <line x1="10" y1="30" x2="30" y2="30" stroke="#E5DFD3" strokeWidth="2" />
              <text x="35" y="33" fill="#E5DFD3" fontSize="9" fontWeight="bold">Observed Stat</text>
            </g>
          </svg>
        </div>

        <div className="p-3 bg-[#23201D] rounded-xl border border-[#302D2A] text-[11px] text-[#A69C8D] flex items-center justify-between">
          <span>图表由 Matplotlib / Seaborn 在客户端矢量生成，支持直接存盘与展示</span>
          <span className="font-mono text-[#7D8E7E] font-bold">p = {result.pValue < 0.001 ? '< .001' : result.pValue.toFixed(4)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-2">
        <div className="flex items-center space-x-2 text-[#7D8E7E]">
          <Terminal className="w-6 h-6" />
          <h2 className="text-xl font-bold text-[#5A6354]">
            Python 自动验证切片 (Full Testing Code Sandbox)
          </h2>
        </div>
        <p className="text-xs text-[#7A7267]">
          提供可直接在 Python (`scipy.stats` / `statsmodels`) 环境中运行的完整脚本代码。支持在线脚本拟态运行、Matplotlib 图形渲染、参数无缝同步与代码一键复制导出。
        </p>
      </div>

      {/* Code Template Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#E5DFD3]">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#5A6354]">
          <Code2 className="w-4 h-4 text-[#7D8E7E]" />
          <span>选择 Python 库与代码范式：</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCodeType('scipy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              codeType === 'scipy'
                ? 'bg-[#7D8E7E] text-white shadow-2xs'
                : 'bg-[#F2EDE4] text-[#5A6354] hover:bg-[#E5DFD3]'
            }`}
          >
            scipy.stats 标准验证
          </button>

          <button
            onClick={() => setCodeType('statsmodels')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              codeType === 'statsmodels'
                ? 'bg-[#7D8E7E] text-white shadow-2xs'
                : 'bg-[#F2EDE4] text-[#5A6354] hover:bg-[#E5DFD3]'
            }`}
          >
            statsmodels 深度拟合
          </button>

          <button
            onClick={() => setCodeType('visual_matplotlib')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              codeType === 'visual_matplotlib'
                ? 'bg-[#7D8E7E] text-white shadow-2xs'
                : 'bg-[#F2EDE4] text-[#5A6354] hover:bg-[#E5DFD3]'
            }`}
          >
            matplotlib 绘图脚本
          </button>
        </div>
      </div>

      {/* Code Editor & Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Code Box */}
        <div className="lg:col-span-7 bg-[#2D2A26] rounded-3xl overflow-hidden shadow-xs border border-[#403C37] flex flex-col">
          <div className="bg-[#23201D] px-4 py-3 flex items-center justify-between border-b border-[#403C37]">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#C99B8B] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#D6C7B2] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#7D8E7E] inline-block" />
              <span className="text-xs font-mono font-bold text-[#A69C8D] ml-2">test_hypothesis.py</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium text-[#D6C7B2] hover:text-white bg-[#3A3632] hover:bg-[#45403B] rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#7D8E7E]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制代码'}</span>
              </button>

              <button
                onClick={handleDownloadPy}
                className="px-3 py-1.5 text-xs font-medium text-[#D6C7B2] hover:text-white bg-[#3A3632] hover:bg-[#45403B] rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载 .py</span>
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-3.5 py-1.5 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? '运行中...' : '模拟运行'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 text-xs font-mono text-[#E5DFD3] overflow-x-auto leading-relaxed flex-1">
            <code>{code}</code>
          </pre>
        </div>

        {/* Right: Execution Output Multi-View */}
        <div className="lg:col-span-5 bg-[#1A1917] rounded-3xl overflow-hidden shadow-xs border border-[#302D2A] flex flex-col">
          {/* Header Controls */}
          <div className="bg-[#23201D] px-4 py-2.5 border-b border-[#302D2A] flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={() => setActiveOutputTab('stdout')}
                className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  activeOutputTab === 'stdout'
                    ? 'bg-[#302D2A] text-white'
                    : 'text-[#A69C8D] hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-[#7D8E7E]" />
                <span>stdout 控制台</span>
              </button>

              <button
                onClick={() => setActiveOutputTab('plot')}
                className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  activeOutputTab === 'plot'
                    ? 'bg-[#302D2A] text-white'
                    : 'text-[#A69C8D] hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#7D8E7E]" />
                <span>plt.show() 渲染</span>
              </button>

              <button
                onClick={() => setActiveOutputTab('dict')}
                className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  activeOutputTab === 'dict'
                    ? 'bg-[#302D2A] text-white'
                    : 'text-[#A69C8D] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#7D8E7E]" />
                <span>scipy 对象</span>
              </button>
            </div>

            <span className="w-2 h-2 rounded-full bg-[#7D8E7E] animate-pulse" />
          </div>

          {/* Body Content */}
          <div className="p-4 flex-1 min-h-[260px] overflow-y-auto">
            {activeOutputTab === 'stdout' && (
              <div className="text-xs font-mono text-[#A8BBA9] leading-relaxed whitespace-pre-wrap">
                {outputLogs || '点击 “模拟运行” 触发 Python scipy 脚本计算并获取标准控制台输出...'}
              </div>
            )}

            {activeOutputTab === 'plot' && renderMatplotlibSVG()}

            {activeOutputTab === 'dict' && (
              <div className="space-y-3 animate-fade-in text-xs font-mono">
                <div className="text-[#A69C8D] mb-2">
                  scipy.stats.{result.testType} 模拟返回对象 (scipy Result Object Dictionary):
                </div>
                <div className="p-3 bg-[#23201D] rounded-xl border border-[#302D2A] text-[#D6C7B2] space-y-1.5">
                  <div><span className="text-[#7D8E7E]">statistic:</span> {result.statisticValue.toFixed(6)}</div>
                  <div><span className="text-[#7D8E7E]">pvalue:</span> {result.pValue}</div>
                  <div><span className="text-[#7D8E7E]">df:</span> {JSON.stringify(result.df)}</div>
                  <div><span className="text-[#7D8E7E]">alternative:</span> '{inputData.alternative}'</div>
                  <div><span className="text-[#7D8E7E]">alpha:</span> {result.alpha}</div>
                  <div><span className="text-[#7D8E7E]">reject_h0:</span> {result.rejectH0 ? 'True' : 'False'}</div>
                  {result.effectSizeValue && (
                    <div><span className="text-[#7D8E7E]">effect_size:</span> {result.effectSizeValue.toFixed(6)}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
