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
      const isChi2 = testType === 'chi2_independence';
      const isF = testType === 'f_two_variance' || testType === 'f_anova_one_way';
      const isZ = testType === 'z_one_sample' || testType === 'z_proportion_one' || testType === 'z_proportion_two';
      const isT = testType === 't_one_sample' || testType === 't_two_sample_ind' || testType === 't_paired';

      const statVal = Number(result.statisticValue.toFixed(4));
      const alt = inputData.alternative;

      if (isChi2) {
        const df = typeof result.df === 'number' ? result.df : 1;
        return `import scipy.stats as stats
import numpy as np
import matplotlib.pyplot as plt

# ==============================================================================
# 卡方独立性检验分布与拒绝域可视化 (Chi-Square Distribution Plot)
# 可在本地 Python 3 环境中直接运行 (需安装 scipy, numpy, matplotlib)
# ==============================================================================

# 设置绘图风格 (自动适配环境)
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
fig, ax = plt.subplots(figsize=(9, 5), dpi=120)

df = ${df}
alpha = ${alpha}
stat_val = ${statVal}

# 生成卡方分布 X 轴范围
max_x = max(20.0, stat_val * 1.3, float(stats.chi2.ppf(0.999, df)))
x = np.linspace(0.01, max_x, 600)
y = stats.chi2.pdf(x, df)

# 临界值 (卡方检验通常为右侧单尾拒绝域)
crit = float(stats.chi2.ppf(1 - alpha, df))

# 绘制卡方分布概率密度曲线
ax.plot(x, y, label=f'Chi-Square PDF (df={df})', color='#3D523E', lw=2.2)

# 填充拒绝域 (Rejection Region)
ax.fill_between(x, y, where=(x >= crit), color='#C99B8B', alpha=0.55, label=f'Rejection Region (α={alpha})')

# 标注临界值线与观测统计量线
ax.axvline(crit, color='#8C4332', linestyle='--', lw=1.8, label=f'Critical Value χ²_crit = {crit:.3f}')
ax.axvline(stat_val, color='#2D2A26', linestyle='-', lw=2.5, label=f'Observed χ² = {stat_val:.3f}')

# 图形修饰与标签
ax.set_title("${result.testName} - 抽样分布与拒绝域", fontsize=13, fontweight='bold', pad=14)
ax.set_xlabel("Chi-Square Statistic Value (χ²)", fontsize=10, labelpad=8)
ax.set_ylabel("Probability Density f(χ²)", fontsize=10, labelpad=8)
ax.set_xlim(0, max_x)
ax.set_ylim(bottom=0)
ax.legend(loc='upper right', frameon=True, facecolor='white', framealpha=0.9)
plt.tight_layout()

# 保存并展示图形
plt.savefig("hypothesis_test_chisq_plot.png", dpi=300)
print("图表已成功保存为 hypothesis_test_chisq_plot.png")
plt.show()
`;
      }

      if (isF) {
        const df1 = testType === 'f_two_variance' ? (inputData.group1Size ?? 15) - 1 : 2;
        const df2 = testType === 'f_two_variance' ? (inputData.group2Size ?? 15) - 1 : 12;
        return `import scipy.stats as stats
import numpy as np
import matplotlib.pyplot as plt

# ==============================================================================
# F 检验分布与拒绝域可视化 (F-Distribution Plot)
# 可在本地 Python 3 环境中直接运行 (需安装 scipy, numpy, matplotlib)
# ==============================================================================

plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
fig, ax = plt.subplots(figsize=(9, 5), dpi=120)

df1 = ${df1}
df2 = ${df2}
alpha = ${alpha}
stat_val = ${statVal}
alternative = '${alt}'

# 生成 F 分布 X 轴范围
max_x = max(6.0, stat_val * 1.3, float(stats.f.ppf(0.995, df1, df2)))
x = np.linspace(0.01, max_x, 600)
y = stats.f.pdf(x, df1, df2)

# 绘制 F 概率密度曲线
ax.plot(x, y, label=f'F-Distribution PDF (df1={df1}, df2={df2})', color='#3D523E', lw=2.2)

# 根据备择假设填充拒绝域
if alternative == 'two_sided':
    crit_low = float(stats.f.ppf(alpha / 2, df1, df2))
    crit_high = float(stats.f.ppf(1 - alpha / 2, df1, df2))
    ax.fill_between(x, y, where=(x <= crit_low), color='#C99B8B', alpha=0.55, label=f'Rejection Lower (α/2={alpha/2:.3f})')
    ax.fill_between(x, y, where=(x >= crit_high), color='#C99B8B', alpha=0.55, label=f'Rejection Upper (α/2={alpha/2:.3f})')
    ax.axvline(crit_low, color='#8C4332', linestyle='--', lw=1.5, label=f'Crit Low = {crit_low:.3f}')
    ax.axvline(crit_high, color='#8C4332', linestyle='--', lw=1.5, label=f'Crit High = {crit_high:.3f}')
elif alternative == 'greater':
    crit = float(stats.f.ppf(1 - alpha, df1, df2))
    ax.fill_between(x, y, where=(x >= crit), color='#C99B8B', alpha=0.55, label=f'Rejection Region (α={alpha})')
    ax.axvline(crit, color='#8C4332', linestyle='--', lw=1.8, label=f'F_crit = {crit:.3f}')
else:
    crit = float(stats.f.ppf(alpha, df1, df2))
    ax.fill_between(x, y, where=(x <= crit), color='#C99B8B', alpha=0.55, label=f'Rejection Region (α={alpha})')
    ax.axvline(crit, color='#8C4332', linestyle='--', lw=1.8, label=f'F_crit = {crit:.3f}')

# 标注观测 F 统计量
ax.axvline(stat_val, color='#2D2A26', linestyle='-', lw=2.5, label=f'Observed F = {stat_val:.3f}')

ax.set_title("${result.testName} - F 抽样分布与拒绝域", fontsize=13, fontweight='bold', pad=14)
ax.set_xlabel("F Statistic Value", fontsize=10, labelpad=8)
ax.set_ylabel("Probability Density f(F)", fontsize=10, labelpad=8)
ax.set_xlim(0, max_x)
ax.set_ylim(bottom=0)
ax.legend(loc='upper right', frameon=True, facecolor='white', framealpha=0.9)
plt.tight_layout()

plt.savefig("hypothesis_test_f_plot.png", dpi=300)
print("图表已成功保存为 hypothesis_test_f_plot.png")
plt.show()
`;
      }

      // t or Z distribution
      const dfVal = typeof result.df === 'number' && result.df !== Infinity ? result.df : 30;
      const isZTest = isZ || result.df === Infinity;

      return `import scipy.stats as stats
import numpy as np
import matplotlib.pyplot as plt

# ==============================================================================
# ${isZTest ? '标准正态 (Z) 分布' : '学生氏 t 分布'}与拒绝域可视化
# 可在本地 Python 3 环境中直接运行 (需安装 scipy, numpy, matplotlib)
# ==============================================================================

plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
fig, ax = plt.subplots(figsize=(9, 5), dpi=120)

alpha = ${alpha}
stat_val = ${statVal}
alternative = '${alt}'
${isZTest ? `
# 标准正态 Z 采样分布
dist = stats.norm()
dist_name = "Standard Normal (Z) PDF"
` : `
# 学生氏 t 采样分布 (df=${dfVal})
df = ${dfVal}
dist = stats.t(df=df)
dist_name = f"Student's t PDF (df={df})"
`}

# 动态设定 X 轴绘图区间
x_min = min(-4.0, stat_val - 1.2)
x_max = max(4.0, stat_val + 1.2)
x = np.linspace(x_min, x_max, 600)
y = dist.pdf(x)

# 绘制概率密度函数
ax.plot(x, y, label=dist_name, color='#5A6354', lw=2.2)

# 根据备择假设填充拒绝域与临界线
if alternative == 'two_sided':
    crit_val = float(dist.ppf(1 - alpha / 2))
    ax.fill_between(x, y, where=(x >= crit_val), color='#C99B8B', alpha=0.55, label=f'Rejection Region (Upper α/2={alpha/2:.3f})')
    ax.fill_between(x, y, where=(x <= -crit_val), color='#C99B8B', alpha=0.55, label=f'Rejection Region (Lower α/2={alpha/2:.3f})')
    ax.axvline(crit_val, color='#8C4332', linestyle='--', lw=1.8, label=f'Critical Cutoff (+{crit_val:.3f})')
    ax.axvline(-crit_val, color='#8C4332', linestyle='--', lw=1.8, label=f'Critical Cutoff (-{crit_val:.3f})')
elif alternative == 'greater':
    crit_val = float(dist.ppf(1 - alpha))
    ax.fill_between(x, y, where=(x >= crit_val), color='#C99B8B', alpha=0.55, label=f'Rejection Region (α={alpha})')
    ax.axvline(crit_val, color='#8C4332', linestyle='--', lw=1.8, label=f'Critical Cutoff (+{crit_val:.3f})')
else:  # 'less'
    crit_val = float(dist.ppf(alpha))
    ax.fill_between(x, y, where=(x <= crit_val), color='#C99B8B', alpha=0.55, label=f'Rejection Region (α={alpha})')
    ax.axvline(crit_val, color='#8C4332', linestyle='--', lw=1.8, label=f'Critical Cutoff ({crit_val:.3f})')

# 标注实际观测统计量
stat_label = "${result.statisticName}"
ax.axvline(stat_val, color='#2D2A26', linestyle='-', lw=2.5, label=f'Observed {stat_label} = {stat_val:.3f}')

# 标注图表细节
ax.set_title("${result.testName} - 抽样分布与拒绝域", fontsize=13, fontweight='bold', pad=14)
ax.set_xlabel(f"{stat_label} Test Statistic Value", fontsize=10, labelpad=8)
ax.set_ylabel("Probability Density", fontsize=10, labelpad=8)
ax.set_xlim(x_min, x_max)
ax.set_ylim(bottom=0)
ax.legend(loc='upper right', frameon=True, facecolor='white', framealpha=0.9)
plt.tight_layout()

plt.savefig("hypothesis_test_distribution_plot.png", dpi=300)
print("图表已成功保存为 hypothesis_test_distribution_plot.png")
plt.show()
`;
    }

    if (codeType === 'statsmodels') {
      const smAlt = inputData.alternative === 'two_sided' ? 'two-sided' : (inputData.alternative === 'greater' ? 'larger' : 'smaller');

      switch (testType) {
        case 't_one_sample':
          return `import numpy as np
from statsmodels.stats.weightstats import DescrStatsW

# ==============================================================================
# 单样本 t 检验 - statsmodels 实现
# ==============================================================================

sample_mean = ${inputData.sampleMean ?? 102}
sample_sd = ${inputData.sampleSd ?? 12}
n = ${inputData.sampleSize ?? 15}
mu0 = ${inputData.nullValue ?? 100}
alpha = ${alpha}
alternative = '${smAlt}'  # statsmodels 备择假设支持: 'two-sided', 'larger', 'smaller'

# 基于样本均值与方差生成代表性样本数据
np.random.seed(42)
raw_data = np.random.randn(n)
data = (raw_data - np.mean(raw_data)) / np.std(raw_data, ddof=1) * sample_sd + sample_mean

# 运行 statsmodels DescrStatsW t 检验
dstat = DescrStatsW(data)
t_stat, p_val, df = dstat.ttest_mean(value=mu0, alternative=alternative)
ci_low, ci_high = dstat.tconfint_mean(alpha=alpha, alternative='two-sided')

print("=" * 50)
print("statsmodels 单样本 t 检验输出 (DescrStatsW.ttest_mean)")
print("=" * 50)
print(f"样本均值 (Mean): {np.mean(data):.4f}")
print(f"样本标准差 (SD): {np.std(data, ddof=1):.4f}")
print(f"t 统计量: {t_stat:.4f}, 自由度 df: {df}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"{(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"决策结论: {'拒绝 H0 (在 α=' + str(alpha) + ' 水平下显著)' if p_val <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        case 't_two_sample_ind':
          return `import numpy as np
from statsmodels.stats.weightstats import CompareMeans, DescrStatsW

# ==============================================================================
# 独立双样本 t 检验 - statsmodels 实现
# ==============================================================================

m1, s1, n1 = ${inputData.group1Mean ?? 105}, ${inputData.group1Sd ?? 10}, ${inputData.group1Size ?? 20}
m2, s2, n2 = ${inputData.group2Mean ?? 98}, ${inputData.group2Sd ?? 12}, ${inputData.group2Size ?? 20}
alpha = ${alpha}
alternative = '${smAlt}'

np.random.seed(42)
raw1 = np.random.randn(n1)
g1 = (raw1 - np.mean(raw1)) / np.std(raw1, ddof=1) * s1 + m1

raw2 = np.random.randn(n2)
g2 = (raw2 - np.mean(raw2)) / np.std(raw2, ddof=1) * s2 + m2

d1 = DescrStatsW(g1)
d2 = DescrStatsW(g2)
cm = CompareMeans(d1, d2)

# Welch's t-test (usevar='unequal')
t_stat, p_val, df = cm.ttest_ind(alternative=alternative, usevar='unequal')
ci_low, ci_high = cm.tconfint_diff(alpha=alpha, alternative='two-sided', usevar='unequal')

print("=" * 50)
print("statsmodels 独立双样本 t 检验输出 (CompareMeans.ttest_ind)")
print("=" * 50)
print(f"组1均值: {np.mean(g1):.4f}, 组2均值: {np.mean(g2):.4f}, 均值差: {np.mean(g1) - np.mean(g2):.4f}")
print(f"t 统计量: {t_stat:.4f}, Welch 自由度 df: {df:.2f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"均值差 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"决策结论: {'拒绝 H0 (两组均值存在显著差异)' if p_val <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        case 't_paired':
          return `import numpy as np
from statsmodels.stats.weightstats import DescrStatsW

# ==============================================================================
# 配对样本 t 检验 - statsmodels 实现
# ==============================================================================

mean_diff = ${inputData.sampleMean ?? 4.5}
sd_diff = ${inputData.sampleSd ?? 6.2}
n = ${inputData.sampleSize ?? 20}
alpha = ${alpha}
alternative = '${smAlt}'

np.random.seed(42)
raw = np.random.randn(n)
diffs = (raw - np.mean(raw)) / np.std(raw, ddof=1) * sd_diff + mean_diff

dstat = DescrStatsW(diffs)
t_stat, p_val, df = dstat.ttest_mean(value=0, alternative=alternative)
ci_low, ci_high = dstat.tconfint_mean(alpha=alpha, alternative='two-sided')

print("=" * 50)
print("statsmodels 配对样本 t 检验输出 (DescrStatsW.ttest_mean on differences)")
print("=" * 50)
print(f"配对差值均值 d̄: {np.mean(diffs):.4f}, 差值标准差 sd: {np.std(diffs, ddof=1):.4f}")
print(f"t 统计量: {t_stat:.4f}, 自由度 df: {df}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"差值 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"决策结论: {'拒绝 H0 (前后/配对差值显著)' if p_val <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        case 'z_one_sample':
          return `import numpy as np
from statsmodels.stats.weightstats import DescrStatsW

# ==============================================================================
# 单样本 Z 检验 - statsmodels 实现
# ==============================================================================

sample_mean = ${inputData.sampleMean ?? 102}
sigma = ${inputData.sampleSd ?? 12}
n = ${inputData.sampleSize ?? 15}
mu0 = ${inputData.nullValue ?? 100}
alpha = ${alpha}
alternative = '${smAlt}'

np.random.seed(42)
raw = np.random.randn(n)
data = (raw - np.mean(raw)) / np.std(raw, ddof=1) * sigma + sample_mean

dstat = DescrStatsW(data)
z_stat, p_val = dstat.ztest_mean(value=mu0, alternative=alternative)
ci_low, ci_high = dstat.zconfint_mean(alpha=alpha, alternative='two-sided')

print("=" * 50)
print("statsmodels 单样本 Z 检验输出 (DescrStatsW.ztest_mean)")
print("=" * 50)
print(f"样本均值: {np.mean(data):.4f}, 总体标准差 σ: {sigma}")
print(f"Z 统计量: {z_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"{(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"决策结论: {'拒绝 H0 (显著差异)' if p_val <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        case 'z_proportion_one':
          return `from statsmodels.stats.proportion import proportions_ztest, proportion_confint

# ==============================================================================
# 单样本比例 Z 检验 - statsmodels 实现
# ==============================================================================

count = ${inputData.x1 ?? 60}
nobs = ${inputData.n1 ?? inputData.sampleSize ?? 100}
p0 = ${inputData.nullValue ?? 0.5}
alpha = ${alpha}
alternative = '${smAlt}'

# 运行比例 Z 检验
z_stat, p_val = proportions_ztest(count=count, nobs=nobs, value=p0, alternative=alternative)
ci_low, ci_high = proportion_confint(count=count, nobs=nobs, alpha=alpha, method='wilson')

p_hat = count / nobs

print("=" * 50)
print("statsmodels 单样本比例 Z 检验输出 (proportions_ztest)")
print("=" * 50)
print(f"样本转化数 x: {count}, 样本量 n: {nobs}, 样本比例 p̂: {p_hat:.4f} ({p_hat*100:.2f}%)")
print(f"原假设比例 p0: {p0:.4f}")
print(f"Z 统计量: {z_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"{(1 - alpha) * 100}% Wilson 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"决策结论: {'拒绝 H0 (比例与目标存在显著差异)' if p_val <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        case 'z_proportion_two':
          return `import numpy as np
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep

# ==============================================================================
# 双样本比例之差 Z 检验 (A/B Test) - statsmodels 实现
# ==============================================================================

count = np.array([${inputData.x1 ?? 45}, ${inputData.x2 ?? 25}])
nobs = np.array([${inputData.n1 ?? 300}, ${inputData.n2 ?? 300}])
alpha = ${alpha}
alternative = '${smAlt}'

# 运行双样本比例检验
z_stat, p_val = proportions_ztest(count=count, nobs=nobs, alternative=alternative)
ci_low, ci_high = confint_proportions_2indep(count1=count[0], nobs1=nobs[0], count2=count[1], nobs2=nobs[1], compare='diff', alpha=alpha)

p1 = count[0] / nobs[0]
p2 = count[1] / nobs[1]

print("=" * 50)
print("statsmodels 双样本比例 Z 检验输出 (proportions_ztest)")
print("=" * 50)
print(f"组1 (p̂1): {count[0]}/{nobs[0]} = {p1:.4f} ({p1*100:.2f}%)")
print(f"组2 (p̂2): {count[1]}/{nobs[1]} = {p2:.4f} ({p2*100:.2f}%)")
print(f"比例之差 (p̂1 - p̂2): {p1 - p2:.4f}")
print(f"Z 统计量: {z_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"比例差 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"决策结论: {'拒绝 H0 (两组转化率存在显著差异)' if p_val <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        case 'chi2_independence':
          return `import numpy as np
from statsmodels.stats.contingency_tables import Table

# ==============================================================================
# 卡方独立性检验 - statsmodels 实现
# ==============================================================================

observed = np.array([
    [35, 15],
    [20, 30]
])
alpha = ${alpha}

table = Table(observed)
rslt = table.test_nominal_association()

print("=" * 50)
print("statsmodels 卡方独立性检验输出 (contingency_tables.Table)")
print("=" * 50)
print("观测频数矩阵 (Observed Table):")
print(observed)
print("期望频数矩阵 (Fitted Expected):")
print(np.round(table.fittedvalues, 2))
print(f"χ² 统计量: {rslt.statistic:.4f}, 自由度 df: {rslt.df}")
print(f"p 值 (p-value): {rslt.pvalue:.6f}")
print(f"决策结论: {'拒绝 H0 (分类变量之间关联显著)' if rslt.pvalue <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        case 'f_two_variance':
          return `import scipy.stats as stats
import numpy as np

# ==============================================================================
# 双样本方差比 F 检验 - statsmodels & scipy 实现
# ==============================================================================

s1, n1 = ${inputData.group1Sd ?? 10}, ${inputData.group1Size ?? 20}
s2, n2 = ${inputData.group2Sd ?? 12}, ${inputData.group2Size ?? 20}
alpha = ${alpha}
alternative = '${inputData.alternative}'

var1 = s1 ** 2
var2 = s2 ** 2
f_stat = var1 / var2
df1 = n1 - 1
df2 = n2 - 1

if alternative == 'two_sided':
    p_val = 2 * min(stats.f.cdf(f_stat, df1, df2), 1 - stats.f.cdf(f_stat, df1, df2))
elif alternative == 'greater':
    p_val = 1 - stats.f.cdf(f_stat, df1, df2)
else:
    p_val = stats.f.cdf(f_stat, df1, df2)

ci_low = f_stat / stats.f.ppf(1 - alpha / 2, df1, df2)
ci_high = f_stat / stats.f.ppf(alpha / 2, df1, df2)

print("=" * 50)
print("双样本方差比 F 检验输出")
print("=" * 50)
print(f"组1 方差 s1²: {var1:.4f} (df1={df1}), 组2 方差 s2²: {var2:.4f} (df2={df2})")
print(f"F 统计量 (s1²/s2²): {f_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"方差比 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"决策结论: {'拒绝 H0 (两组总体方差存在显著差异)' if p_val <= alpha else '无法拒绝 H0'}")
print("=" * 50)
`;

        default:
          return `import pandas as pd
import statsmodels.api as sm
from statsmodels.formula.api import ols

# ==============================================================================
# 单因素方差分析 (One-Way ANOVA) - statsmodels OLS 实现
# ==============================================================================

np.random.seed(42)
data = {
    'value': np.concatenate([
        np.random.normal(105, 10, 20),
        np.random.normal(98, 12, 20),
        np.random.normal(112, 11, 20)
    ]),
    'group': ['Group_A'] * 20 + ['Group_B'] * 20 + ['Group_C'] * 20
}
df = pd.DataFrame(data)

model = ols('value ~ C(group)', data=df).fit()
anova_table = sm.stats.anova_lm(model, typ=2)

print("=" * 50)
print("statsmodels 单因素方差分析 ANOVA 表 (anova_lm)")
print("=" * 50)
print(anova_table)
`;
      }
    }

    // Default: scipy.stats standard verification
    switch (testType) {
      case 't_one_sample':
        return `import scipy.stats as stats
import numpy as np
import math

# ==============================================================================
# 单样本 t 检验 (One-Sample t-Test) - SciPy 完整可独立运行脚本
# ==============================================================================

# 1. 检验输入参数 (可自由修改)
sample_mean = ${inputData.sampleMean ?? 102}    # 样本均值 x̄
sample_sd = ${inputData.sampleSd ?? 12}        # 样本标准差 s
n = ${inputData.sampleSize ?? 15}               # 样本容量 n
mu0 = ${inputData.nullValue ?? 100}             # 原假设总体均值 μ₀
alpha = ${alpha}                               # 显著性水平 α
alternative = '${inputData.alternative}'       # 备择假设: 'two_sided', 'greater', 'less'

# 2. 计算标准误与 t 统计量
df = n - 1
se = sample_sd / math.sqrt(n)
t_stat = (sample_mean - mu0) / se

# 3. 计算 p 值与临界值
if alternative == 'two_sided':
    p_val = 2 * (1 - stats.t.cdf(abs(t_stat), df=df))
    t_crit = stats.t.ppf(1 - alpha / 2, df=df)
    crit_str = f"±{t_crit:.4f}"
elif alternative == 'greater':
    p_val = 1 - stats.t.cdf(t_stat, df=df)
    t_crit = stats.t.ppf(1 - alpha, df=df)
    crit_str = f"+{t_crit:.4f}"
else:  # 'less'
    p_val = stats.t.cdf(t_stat, df=df)
    t_crit = stats.t.ppf(alpha, df=df)
    crit_str = f"{t_crit:.4f}"

# 4. 计算置信区间与效应量 Cohen's d
t_ci_crit = stats.t.ppf(1 - alpha / 2, df=df)
ci_low = sample_mean - t_ci_crit * se
ci_high = sample_mean + t_ci_crit * se
cohen_d = (sample_mean - mu0) / sample_sd

# 5. 打印格式化检验报告
print("=" * 60)
print("单样本 t 检验 (One-Sample t-Test) 验证报告")
print("=" * 60)
print(f"样本均值 x̄: {sample_mean:.4f}, 样本标准差 s: {sample_sd:.4f}, 样本量 n: {n}")
print(f"原假设 H₀: μ = {mu0}")
alt_symbol = "≠" if alternative == "two_sided" else (">" if alternative == "greater" else "<")
print(f"备择假设 H₁: μ {alt_symbol} {mu0}")
print("-" * 60)
print(f"t 统计量 (t-statistic): {t_stat:.4f}")
print(f"自由度 (df): {df}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"显著性水平 α={alpha} 对应临界值: {crit_str}")
print(f"{(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"效应量 Cohen's d: {cohen_d:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (统计学上显著差异)" if p_val <= alpha else "无法拒绝原假设 H₀ (未发现显著差异)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      case 't_two_sample_ind':
        return `import scipy.stats as stats
import numpy as np
import math

# ==============================================================================
# 独立双样本 t 检验 (Independent Two-Sample t-Test) - SciPy 完整脚本
# ==============================================================================

# 1. 组别输入参数
m1, s1, n1 = ${inputData.group1Mean ?? 105}, ${inputData.group1Sd ?? 10}, ${inputData.group1Size ?? 20}
m2, s2, n2 = ${inputData.group2Mean ?? 98}, ${inputData.group2Sd ?? 12}, ${inputData.group2Size ?? 20}
alpha = ${alpha}
alternative = '${inputData.alternative}'

# 2. 使用 SciPy 官方标准统计量函数 (stats.ttest_ind_from_stats)
# 注: 采用 Welch's t-test (equal_var=False) 避免方差不齐偏差
res = stats.ttest_ind_from_stats(
    mean1=m1, std1=s1, nobs1=n1,
    mean2=m2, std2=s2, nobs2=n2,
    equal_var=False,
    alternative=alternative
)

# 3. 计算 Welch-Satterthwaite 自由度与置信区间
se_diff = math.sqrt((s1 ** 2) / n1 + (s2 ** 2) / n2)
df_welch = ((s1 ** 2 / n1 + s2 ** 2 / n2) ** 2) / (
    ((s1 ** 2 / n1) ** 2) / (n1 - 1) + ((s2 ** 2 / n2) ** 2) / (n2 - 1)
)
t_crit = stats.t.ppf(1 - alpha / 2, df=df_welch)
mean_diff = m1 - m2
ci_low = mean_diff - t_crit * se_diff
ci_high = mean_diff + t_crit * se_diff

# 4. 效应量 Cohen's d (合并标准差)
s_pooled = math.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
cohen_d = mean_diff / s_pooled

print("=" * 60)
print("独立双样本 t 检验 (Independent t-Test) 验证报告")
print("=" * 60)
print(f"组1: 均值={m1:.4f}, 标准差={s1:.4f}, n={n1}")
print(f"组2: 均值={m2:.4f}, 标准差={s2:.4f}, n={n2}")
print(f"均值之差 (x̄₁ - x̄₂): {mean_diff:.4f}, 标准误 SE: {se_diff:.4f}")
print("-" * 60)
print(f"t 统计量: {res.statistic:.4f}")
print(f"Welch 自由度 df: {df_welch:.2f}")
print(f"p 值 (p-value): {res.pvalue:.6f}")
print(f"均值差 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"效应量 Cohen's d: {cohen_d:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (两组均值存在显著差异)" if res.pvalue <= alpha else "无法拒绝原假设 H₀ (两组无显著差异)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      case 't_paired':
        return `import scipy.stats as stats
import numpy as np
import math

# ==============================================================================
# 配对样本 t 检验 (Paired Samples t-Test) - SciPy 完整脚本
# ==============================================================================

# 1. 配对差值参数 (前-后 配对差值)
mean_diff = ${inputData.sampleMean ?? 4.5}    # 配对差值均值 d̄
sd_diff = ${inputData.sampleSd ?? 6.2}        # 配对差值标准差 s_d
n = ${inputData.sampleSize ?? 20}             # 配对样本数 n
mu_diff_0 = 0.0                               # 原假设配对差值 μ_d = 0
alpha = ${alpha}
alternative = '${inputData.alternative}'

# 2. 统计量与自由度计算
df = n - 1
se = sd_diff / math.sqrt(n)
t_stat = (mean_diff - mu_diff_0) / se

# 3. p 值与临界值计算
if alternative == 'two_sided':
    p_val = 2 * (1 - stats.t.cdf(abs(t_stat), df=df))
    t_crit = stats.t.ppf(1 - alpha / 2, df=df)
    crit_str = f"±{t_crit:.4f}"
elif alternative == 'greater':
    p_val = 1 - stats.t.cdf(t_stat, df=df)
    t_crit = stats.t.ppf(1 - alpha, df=df)
    crit_str = f"+{t_crit:.4f}"
else:
    p_val = stats.t.cdf(t_stat, df=df)
    t_crit = stats.t.ppf(alpha, df=df)
    crit_str = f"{t_crit:.4f}"

# 4. 置信区间与效应量 Cohen's dz
t_ci_crit = stats.t.ppf(1 - alpha / 2, df=df)
ci_low = mean_diff - t_ci_crit * se
ci_high = mean_diff + t_ci_crit * se
cohen_dz = mean_diff / sd_diff

print("=" * 60)
print("配对样本 t 检验 (Paired t-Test) 验证报告")
print("=" * 60)
print(f"配对差值均值 d̄: {mean_diff:.4f}, 差值标准差 s_d: {sd_diff:.4f}, 配对数 n: {n}")
print(f"原假设 H₀: μ_d = 0, 备择假设 H₁: μ_d {'≠' if alternative == 'two_sided' else ('>' if alternative == 'greater' else '<')} 0")
print("-" * 60)
print(f"t 统计量: {t_stat:.4f}, 自由度 df: {df}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"临界值 (α={alpha}): {crit_str}")
print(f"差值 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"配对效应量 Cohen's dz: {cohen_dz:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (配对前后差异显著)" if p_val <= alpha else "无法拒绝原假设 H₀ (配对差异不显著)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      case 'z_one_sample':
        return `import scipy.stats as stats
import numpy as np
import math

# ==============================================================================
# 单样本 Z 检验 (One-Sample Z-Test) - SciPy 完整脚本
# ==============================================================================

sample_mean = ${inputData.sampleMean ?? 102}
sigma = ${inputData.sampleSd ?? 12}            # 总体已知标准差 σ
n = ${inputData.sampleSize ?? 15}
mu0 = ${inputData.nullValue ?? 100}
alpha = ${alpha}
alternative = '${inputData.alternative}'

se = sigma / math.sqrt(n)
z_stat = (sample_mean - mu0) / se

if alternative == 'two_sided':
    p_val = 2 * (1 - stats.norm.cdf(abs(z_stat)))
    z_crit = stats.norm.ppf(1 - alpha / 2)
    crit_str = f"±{z_crit:.4f}"
elif alternative == 'greater':
    p_val = 1 - stats.norm.cdf(z_stat)
    z_crit = stats.norm.ppf(1 - alpha)
    crit_str = f"+{z_crit:.4f}"
else:
    p_val = stats.norm.cdf(z_stat)
    z_crit = stats.norm.ppf(alpha)
    crit_str = f"{z_crit:.4f}"

z_ci_crit = stats.norm.ppf(1 - alpha / 2)
ci_low = sample_mean - z_ci_crit * se
ci_high = sample_mean + z_ci_crit * se
cohen_d = (sample_mean - mu0) / sigma

print("=" * 60)
print("单样本 Z 检验 (One-Sample Z-Test) 验证报告")
print("=" * 60)
print(f"样本均值 x̄: {sample_mean:.4f}, 总体标准差 σ: {sigma:.4f}, 样本量 n: {n}")
print(f"原假设 H₀: μ = {mu0}, 备择假设 H₁: μ {'≠' if alternative == 'two_sided' else ('>' if alternative == 'greater' else '<')} {mu0}")
print("-" * 60)
print(f"Z 统计量: {z_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"临界值 (α={alpha}): {crit_str}")
print(f"{(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"效应量 Cohen's d: {cohen_d:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (差异显著)" if p_val <= alpha else "无法拒绝原假设 H₀ (差异不显著)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      case 'z_proportion_one':
        return `import scipy.stats as stats
import numpy as np
import math

# ==============================================================================
# 单样本比例 Z 检验 (One-Proportion Z-Test) - SciPy 完整脚本
# ==============================================================================

# 1. 输入数据
x = ${inputData.x1 ?? 60}                       # 观测成功/转化数
n = ${inputData.n1 ?? inputData.sampleSize ?? 100}  # 总样本量
p0 = ${inputData.nullValue ?? 0.5}              # 原假设基准比例 p₀
alpha = ${alpha}
alternative = '${inputData.alternative}'

# 2. 样本比例与标准误计算
p_hat = x / n
se0 = math.sqrt(p0 * (1 - p0) / n)
z_stat = (p_hat - p0) / se0

# 3. p 值与临界值
if alternative == 'two_sided':
    p_val = 2 * (1 - stats.norm.cdf(abs(z_stat)))
    z_crit = stats.norm.ppf(1 - alpha / 2)
    crit_str = f"±{z_crit:.4f}"
elif alternative == 'greater':
    p_val = 1 - stats.norm.cdf(z_stat)
    z_crit = stats.norm.ppf(1 - alpha)
    crit_str = f"+{z_crit:.4f}"
else:
    p_val = stats.norm.cdf(z_stat)
    z_crit = stats.norm.ppf(alpha)
    crit_str = f"{z_crit:.4f}"

# 4. 置信区间 (Wilson Score 区间 & Wald 区间)
z_ci_crit = stats.norm.ppf(1 - alpha / 2)
se_hat = math.sqrt(p_hat * (1 - p_hat) / n)
ci_low = max(0.0, p_hat - z_ci_crit * se_hat)
ci_high = min(1.0, p_hat + z_ci_crit * se_hat)

# 5. 效应量 Cohen's h
cohen_h = 2 * math.asin(math.sqrt(p_hat)) - 2 * math.asin(math.sqrt(p0))

print("=" * 60)
print("单样本比例 Z 检验 (One-Proportion Z-Test) 验证报告")
print("=" * 60)
print(f"观测成功数 x: {x}, 样本量 n: {n}")
print(f"样本估计比例 p̂: {p_hat:.4f} ({p_hat * 100:.2f}%)")
print(f"原假设比例 p₀: {p0:.4f} ({p0 * 100:.2f}%)")
print("-" * 60)
print(f"Z 统计量: {z_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"临界值 (α={alpha}): {crit_str}")
print(f"{(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"效应量 Cohen's h: {cohen_h:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (转化率与目标存在显著差异)" if p_val <= alpha else "无法拒绝原假设 H₀ (未发现显著差异)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      case 'z_proportion_two':
        return `import scipy.stats as stats
import numpy as np
import math

# ==============================================================================
# 双样本比例之差 Z 检验 (Two-Proportion Z-Test / A/B Test) - SciPy 完整脚本
# ==============================================================================

# 1. 组别输入数据
x1, n1 = ${inputData.x1 ?? 45}, ${inputData.n1 ?? 300}
x2, n2 = ${inputData.x2 ?? 25}, ${inputData.n2 ?? 300}
alpha = ${alpha}
alternative = '${inputData.alternative}'

# 2. 比例计算
p1 = x1 / n1
p2 = x2 / n2
p_pooled = (x1 + x2) / (n1 + n2)

# 3. 合并标准误与 Z 统计量
se_pooled = math.sqrt(p_pooled * (1 - p_pooled) * (1 / n1 + 1 / n2))
z_stat = (p1 - p2) / se_pooled

# 4. p 值计算
if alternative == 'two_sided':
    p_val = 2 * (1 - stats.norm.cdf(abs(z_stat)))
    z_crit = stats.norm.ppf(1 - alpha / 2)
    crit_str = f"±{z_crit:.4f}"
elif alternative == 'greater':
    p_val = 1 - stats.norm.cdf(z_stat)
    z_crit = stats.norm.ppf(1 - alpha)
    crit_str = f"+{z_crit:.4f}"
else:
    p_val = stats.norm.cdf(z_stat)
    z_crit = stats.norm.ppf(alpha)
    crit_str = f"{z_crit:.4f}"

# 5. 比例差置信区间与效应量 Cohen's h
z_ci_crit = stats.norm.ppf(1 - alpha / 2)
se_diff = math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
diff = p1 - p2
ci_low = diff - z_ci_crit * se_diff
ci_high = diff + z_ci_crit * se_diff
cohen_h = 2 * math.asin(math.sqrt(p1)) - 2 * math.asin(math.sqrt(p2))

print("=" * 60)
print("双样本比例之差 Z 检验 (A/B Test) 验证报告")
print("=" * 60)
print(f"组1: x₁={x1}, n₁={n1} -> 转化率 p̂₁ = {p1:.4f} ({p1*100:.2f}%)")
print(f"组2: x₂={x2}, n₂={n2} -> 转化率 p̂₂ = {p2:.4f} ({p2*100:.2f}%)")
print(f"比例之差 (p̂₁ - p̂₂): {diff:.4f} ({diff*100:.2f}%)")
print("-" * 60)
print(f"Z 统计量: {z_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"临界值 (α={alpha}): {crit_str}")
print(f"比例差 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print(f"效应量 Cohen's h: {cohen_h:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (两组比例存在显著差异)" if p_val <= alpha else "无法拒绝原假设 H₀ (两组比例无显著差异)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      case 'chi2_independence':
        return `import scipy.stats as stats
import numpy as np
import math

# ==============================================================================
# 卡方独立性检验 (Chi-Square Test of Independence) - SciPy 完整脚本
# ==============================================================================

# 1. 列联表频数矩阵 (Contingency Table)
contingency_table = np.array([
    [35, 15],
    [20, 30]
])
alpha = ${alpha}

# 2. 运行 SciPy 卡方独立性检验
# correction=False 使用标准 Pearson 卡方检验
chi2_stat, p_val, dof, expected = stats.chi2_contingency(contingency_table, correction=False)
crit_val = stats.chi2.ppf(1 - alpha, dof)

# 3. 效应量 Cramer's V 计算
n_total = np.sum(contingency_table)
min_dim = min(contingency_table.shape) - 1
cramers_v = math.sqrt(chi2_stat / (n_total * min_dim)) if min_dim > 0 else 0

print("=" * 60)
print("卡方独立性检验 (Chi-Square Test) 验证报告")
print("=" * 60)
print("观测频数矩阵 (Observed Contingency Table):")
print(contingency_table)
print("\\n理论期望频数矩阵 (Expected Frequencies):")
print(np.round(expected, 2))
print("-" * 60)
print(f"χ² 统计量: {chi2_stat:.4f}")
print(f"自由度 (df): {dof}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"显著性水平 α={alpha} 临界值: {crit_val:.4f}")
print(f"效应量 Cramer's V: {cramers_v:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (分类变量之间存在显著关联)" if p_val <= alpha else "无法拒绝原假设 H₀ (变量相互独立)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      case 'f_two_variance':
        return `import scipy.stats as stats
import numpy as np

# ==============================================================================
# 双样本方差比 F 检验 (Two-Sample F-Test for Variances) - SciPy 完整脚本
# ==============================================================================

s1, n1 = ${inputData.group1Sd ?? 10}, ${inputData.group1Size ?? 20}
s2, n2 = ${inputData.group2Sd ?? 12}, ${inputData.group2Size ?? 20}
alpha = ${alpha}
alternative = '${inputData.alternative}'

var1 = s1 ** 2
var2 = s2 ** 2
f_stat = var1 / var2
df1 = n1 - 1
df2 = n2 - 1

# p 值计算
if alternative == 'two_sided':
    p_val = 2 * min(stats.f.cdf(f_stat, df1, df2), 1 - stats.f.cdf(f_stat, df1, df2))
    crit_low = stats.f.ppf(alpha / 2, df1, df2)
    crit_high = stats.f.ppf(1 - alpha / 2, df1, df2)
    crit_str = f"[{crit_low:.4f}, {crit_high:.4f}]"
elif alternative == 'greater':
    p_val = 1 - stats.f.cdf(f_stat, df1, df2)
    crit_high = stats.f.ppf(1 - alpha, df1, df2)
    crit_str = f">{crit_high:.4f}"
else:
    p_val = stats.f.cdf(f_stat, df1, df2)
    crit_low = stats.f.ppf(alpha, df1, df2)
    crit_str = f"<{crit_low:.4f}"

# 方差比置信区间
ci_low = f_stat / stats.f.ppf(1 - alpha / 2, df1, df2)
ci_high = f_stat / stats.f.ppf(alpha / 2, df1, df2)

print("=" * 60)
print("双样本方差比 F 检验 (F-Test for Variances) 验证报告")
print("=" * 60)
print(f"组1: 方差 s1²={var1:.4f}, 自由度 df1={df1}")
print(f"组2: 方差 s2²={var2:.4f}, 自由度 df2={df2}")
print(f"原假设 H₀: σ₁² = σ₂², 备择假设 H₁: σ₁² {'≠' if alternative == 'two_sided' else ('>' if alternative == 'greater' else '<')} σ₂²")
print("-" * 60)
print(f"F 统计量 (s1²/s2²): {f_stat:.4f}")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"临界值区间 (α={alpha}): {crit_str}")
print(f"总体方差比 {(1 - alpha) * 100}% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")
print("-" * 60)
decision = "拒绝原假设 H₀ (两组总体方差存在显著差异)" if p_val <= alpha else "无法拒绝原假设 H₀ (方差齐性无显著差异)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
`;

      default:
        return `import scipy.stats as stats
import numpy as np

# ==============================================================================
# 单因素方差分析 (One-Way ANOVA) - SciPy 完整脚本
# ==============================================================================

np.random.seed(42)
group_a = np.random.normal(105, 10, 20)
group_b = np.random.normal(98, 12, 20)
group_c = np.random.normal(112, 11, 20)
alpha = ${alpha}

# 运行单因素方差分析
f_stat, p_val = stats.f_oneway(group_a, group_b, group_c)
df_between = 3 - 1
df_within = (len(group_a) + len(group_b) + len(group_c)) - 3
crit_val = stats.f.ppf(1 - alpha, df_between, df_within)

print("=" * 60)
print("单因素方差分析 (One-Way ANOVA) 验证报告")
print("=" * 60)
print(f"组A 均值: {np.mean(group_a):.4f}, 组B 均值: {np.mean(group_b):.4f}, 组C 均值: {np.mean(group_c):.4f}")
print("-" * 60)
print(f"F 统计量: {f_stat:.4f}, 自由度 (df1, df2): ({df_between}, {df_within})")
print(f"p 值 (p-value): {p_val:.6f}")
print(f"显著性水平 α={alpha} 临界值: {crit_val:.4f}")
print("-" * 60)
decision = "拒绝原假设 H₀ (各组均值之间存在显著差异)" if p_val <= alpha else "无法拒绝原假设 H₀ (未发现显著差异)"
print(f"统计推断结论: {decision} (α={alpha})")
print("=" * 60)
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
