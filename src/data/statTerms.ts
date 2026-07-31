export interface StatTermDefinition {
  id: string;
  name: string;
  shortTitle: string;
  aliases: string[];
  category: '核心概念' | '统计指标' | '前提假定' | '检验方法';
  quickDef: string;
  physicalAnalogy: string;
  formulaOrRule: string;
  importance: string;
}

export const STAT_TERMS_DATABASE: StatTermDefinition[] = [
  {
    id: 'df',
    name: '自由度 (Degrees of Freedom, df)',
    shortTitle: '自由度',
    aliases: ['自由度', 'df', 'Degrees of Freedom', '自由度 df'],
    category: '核心概念',
    quickDef: '数据集中能够自由变化的独立数值个数。当统计量（如均值）固定时，可自由选择的数据点将减少 1 个。',
    physicalAnalogy: '10 个人在餐厅选 10 个不同的座位，前 9 个人都有自由选择权，但第 10 个人只能坐剩下的唯一位置，因此选座的自由度为 10 - 1 = 9。',
    formulaOrRule: '单样本 t 检验：df = n - 1；双样本 t 检验：df = n₁ + n₂ - 2；ANOVA 组内：df = N - k。',
    importance: '自由度直接决定了 t 分布或 F 分布曲线的形状（厚尾程度）。样本量越大，自由度越高，t 分布越逼近标准正态分布。',
  },
  {
    id: 'homogeneity',
    name: '方差齐性 (Homogeneity of Variance)',
    shortTitle: '方差齐性',
    aliases: ['方差齐性', 'Homogeneity', '方差齐性假定', 'Levene检验', '方差同质性'],
    category: '前提假定',
    quickDef: '比较的不同组别数据来自波动程度（离散程度/方差）相同的总体，确保比较在公平相同的“噪音基准”下进行。',
    physicalAnalogy: '用同一把精准刻度尺同时测量两件物体。如果一组测量误差极小（噪声低），而另一组测测量波动极大（噪声高），直接比均值就像在风浪不同的水域比船速，是不公平的。',
    formulaOrRule: '常用 Levene 检验或 Bartlett 检验。若 p > 0.05 则满足方差齐性；若不满足可采用 Welch t 检验或数据变换。',
    importance: '方差齐性是标准双样本 t 检验和单因素方差分析 (ANOVA) 的推导前提。若方差齐性破坏，标准 t 检验的假阳性率 (α) 会显著失真。',
  },
  {
    id: 'ci',
    name: '置信区间 (Confidence Interval, 95% CI)',
    shortTitle: '置信区间',
    aliases: ['置信区间', 'CI', 'Confidence Interval', '95% 置信区间', '95% CI'],
    category: '统计指标',
    quickDef: '对总体真实参数（如总体均值）估算出的一个区间范围。95% 置信度意味着重复采样 100 次，约有 95 个区间能成功捕获总体真值。',
    physicalAnalogy: '用套圈游戏去套地上的宝物（总体真值）。套圈本身有大小（区间宽度）。我们无法保证单次必定套中，但这个套圈有 95% 的概率能覆盖住宝物。',
    formulaOrRule: '点估计 ± Critical Value × 标准误 SE (例如：x̄ ± t_crit × (s / √n))',
    importance: '置信区间比单一的 p 值包含更丰富的估算信息（同时展示效应量和不确定度）。若 95% CI 不包含原假设值（如 0），则对应 p < 0.05。',
  },
  {
    id: 'p_value',
    name: 'p 值 (p-value / 显著性概率)',
    shortTitle: 'p 值',
    aliases: ['p值', 'p 值', 'p-value', 'p', '显著性概率'],
    category: '统计指标',
    quickDef: '在原假设 H₀（无效应/无差异）为真的前提下，观察到当前样本数据或比当前更极端结果的条件概率。',
    physicalAnalogy: '假设抛硬币是均匀的（H₀）。连抛 10 次全是正面，这种情况在均匀硬币下发生的概率只有 0.00098（p 值很小），这让我们极大地怀疑“硬币均匀”这个假设。',
    formulaOrRule: '若 p ≤ α，拒绝 H₀，差异具有统计显著性；若 p > α，无法拒绝 H₀。',
    importance: 'p 值衡量的是样本观测结果与原假设模式的“不和谐/冲突程度”，值越小说明原假设成立的概率越令人怀疑。',
  },
  {
    id: 'alpha',
    name: '显著性水平 α (Significance Level / 假阳性上限)',
    shortTitle: '显著性水平 α',
    aliases: ['显著性水平', 'alpha', 'α', '显著性水平 α', '第一类错误率'],
    category: '核心概念',
    quickDef: '研究者人为设定的容忍“弃真（假阳性）”的最大概率红线，通常设置为 0.05 (5%) 或 0.01 (1%)。',
    physicalAnalogy: '法庭审判中的“排除合理怀疑”标准。设置 α = 0.05 意味着我们最多允许 5% 的概率把无辜者（H₀为真）误判为有罪。',
    formulaOrRule: 'α = P(拒绝 H₀ | H₀ 为真)。α 越小，决策越保守，但第二类错误 β 会随之上升。',
    importance: 'α 是假设检验的判决门槛。只有当计算出的 p 值低于 α 时，才允许做出“拒绝 H₀”的推断。',
  },
  {
    id: 'effect_size',
    name: "效应量 (Effect Size / Cohen's d)",
    shortTitle: '效应量',
    aliases: ['效应量', 'Effect Size', "Cohen's d", 'd', '效应大小'],
    category: '统计指标',
    quickDef: '衡量两组之间真实物理差异程度（信号强度）的标准化指标，不受样本量 n 的虚高影响。',
    physicalAnalogy: '测量新药对降血压的实际效果（如平均降低 15 mmHg）。即使通过 10 万大样本把 p 值做到了 0.00001，如果实际降压只有 0.1 mmHg（效应量极微），该药也没有临床价值。',
    formulaOrRule: "Cohen's d = (x̄₁ - x̄₂) / s_pooled。0.2 属于微小效应，0.5 属于中等效应，0.8+ 属于大效应。",
    importance: '区分“统计显著性 (p < 0.05)”与“实际业务价值 (Effect Size)”。回答了“差异到底有多大”的核心问题。',
  },
  {
    id: 'type1_error',
    name: '第一类错误 (Type I Error / 弃真 / 假阳性)',
    shortTitle: '第一类错误 α',
    aliases: ['第一类错误', 'Type I Error', '弃真错误', '假阳性', 'α错误'],
    category: '核心概念',
    quickDef: '原假设 H₀ 本来是真的（无效应/无差异），但由于抽样随机性，误将 H₀ 拒绝的错误决策。',
    physicalAnalogy: '【无罪误判 / 假警报】：一个人本没有生病，但诊断试剂盒却显示“阳性”并将其隔离；或者新药其实没效果，却错误宣称新药有效。',
    formulaOrRule: '概率上限即为显著性水平 α（如 5%）。',
    importance: '在科学研究和新药上市中极其危险，可能导致虚假科学结论或无用药物投入市场。',
  },
  {
    id: 'type2_error',
    name: '第二类错误 (Type II Error / 取伪 / 假阴性)',
    shortTitle: '第二类错误 β',
    aliases: ['第二类错误', 'Type II Error', '取伪错误', '假阴性', 'β错误'],
    category: '核心概念',
    quickDef: '原假设 H₀ 本来是假的（真实存在效应/差异），但因样本量太小或噪声太高，未能将其拒绝的错误决策。',
    physicalAnalogy: '【漏诊 / 错失良机】：病人确实患病，但检测结果显示“阴性”；或者新药其实非常有效果，但因为只测了 5 个病人导致无法得出显著结论。',
    formulaOrRule: '概率为 β。与统计功效（Power = 1 - β）互为补集。',
    importance: '导致有价值的新研究、新产品或改善策略被误认为是无效的而被遗弃。',
  },
  {
    id: 'power',
    name: '统计功效 (Statistical Power / 1-β)',
    shortTitle: '统计功效 1-β',
    aliases: ['统计功效', 'Power', '1-β', '统计检验力', '检出率'],
    category: '统计指标',
    quickDef: '当真实存在效应（备择假设 H₁ 为真）时，检验能够正确识别出显著差异（拒绝 H₀）的概率。',
    physicalAnalogy: '金属探测器的“灵敏度”。如果地底下确实埋着金块，灵敏度高（Power = 90%）的探测器能有 90% 的把握把它找出来。',
    formulaOrRule: 'Power = 1 - β。通常要求学术和工程研究中的 Power ≥ 0.80 (80%)。',
    importance: '可以通过增大样本量 n、增大效应量 d 或适度放宽 α 来提升统计功效，防止因样本量不足而导致实验“白做”。',
  },
  {
    id: 'h0',
    name: '原假设 (Null Hypothesis / H₀)',
    shortTitle: '原假设 H₀',
    aliases: ['原假设', 'Null Hypothesis', 'H0', 'H₀', '零假设'],
    category: '核心概念',
    quickDef: '假设检验中的默认保守主张，假设“无差异、无效应、无变化、现状保持不变”。',
    physicalAnalogy: '法律上的“无罪推定”原则——在拿出足够扎实的证据之前，法庭默认被告人是无罪的。',
    formulaOrRule: '形式如 H₀: μ = μ₀ 或 H₀: μ₁ - μ₂ = 0。',
    importance: '假设检验采用“反证法”逻辑，所有的概率计算（如 p 值）都是建立在“假定 H₀ 为真”的前提下展开的。',
  },
  {
    id: 'h1',
    name: '备择假设 (Alternative Hypothesis / H₁)',
    shortTitle: '备择假设 H₁',
    aliases: ['备择假设', 'Alternative Hypothesis', 'H1', 'H₁', '研究假设'],
    category: '核心概念',
    quickDef: '研究者希望通过收集数据寻找证据来支持的新主张，假设“存在显著差异、存在效应或改变”。',
    physicalAnalogy: '公诉人试图证明的“被告人有罪”主张。只有当证据极其确凿（p < α）时，才能推翻原假设并接受备择假设。',
    formulaOrRule: '形式如 H₁: μ ≠ μ₀（双侧），或 H₁: μ > μ₀（单侧右尾）。',
    importance: '代表了科学发现与创新尝试的方向。',
  },
  {
    id: 'normality',
    name: '正态性假定 (Normality Assumption)',
    shortTitle: '正态性假定',
    aliases: ['正态性假定', 'Normality', '正态分布假定', 'Shapiro-Wilk检验'],
    category: '前提假定',
    quickDef: '要求连续变量在总体中呈对称的“钟形”正态分布，这是大部分参数统计检验（t检验/ANOVA）的数学推导根基。',
    physicalAnalogy: '人类的身高分布——绝大多数人集中在平均身高附近，极高或极矮的人对称地稀少，呈现优雅的钟形曲线。',
    formulaOrRule: '小样本通常使用 Shapiro-Wilk 检验 (p > 0.05 满足正态性) 或 Q-Q 图图形化评估。',
    importance: '当数据严重偏态或存在极端异常值时，强制使用标准 t 检验会导致 p 值不准确，此时应切换为非参数检验（如 Wilcoxon / Mann-Whitney U）。',
  },
  {
    id: 'independence',
    name: '观测独立性假定 (Independence Assumption)',
    shortTitle: '独立性假定',
    aliases: ['独立性假定', 'Independence', '样本独立性', '观测独立'],
    category: '前提假定',
    quickDef: '要求每个样本观测值之间相互独立，一个受试者的测量结果不会影响或预测另一个受试者的结果。',
    physicalAnalogy: '考试中每个人独立作答。如果考生之间互相抄袭（存在相关性），那么 30 个考生的答案就不能算作 30 个“独立的信息源”，信息的有效样本量被严重夸大了。',
    formulaOrRule: '通常依赖实验设计（如随机抽样与随机分组）从源头上保证，无法简单通过统计公式修复。',
    importance: '独立性是假设检验中最重要也最脆弱的前提。一旦违反（如重复测量未做匹配分析），假阳性率会成倍飙升。',
  },
  {
    id: 't_test',
    name: 't 检验 (Student\'s t-Test)',
    shortTitle: 't 检验',
    aliases: ['t检验', 't 检验', 't-Test', "Student's t-test", '单样本t检验', '双样本t检验'],
    category: '检验方法',
    quickDef: '用于在总体标准差 σ 未知的小样本情况下，检验样本均值与总体均值或两组均值之间是否存在显著差异。',
    physicalAnalogy: '小样本质量检定弹簧秤。由于样本少，我们需要引入自由度 df 修正概率分布曲线（t 分布比正态分布具有更厚重的两端尾部，以容忍小样本的额外随机噪声）。',
    formulaOrRule: 't = (x̄ - μ₀) / (s / √n)。',
    importance: '推断统计学中使用最频繁的均值比较工具。',
  },
  {
    id: 'z_test',
    name: 'Z 检验 (Z-Test)',
    shortTitle: 'Z 检验',
    aliases: ['Z检验', 'Z 检验', 'Z-Test', '标准正态检验'],
    category: '检验方法',
    quickDef: '当总体标准差 σ 已知，或者样本量 n 很大（根据中心极限定理）时，基于标准正态分布进行均值或比例的检验。',
    physicalAnalogy: '用经过国家计量局精准校准的标尺测物体。因为总体波动 σ 是完全确定的，没有任何未知的不确定性，因此直接采用标准正态分布。',
    formulaOrRule: 'Z = (x̄ - μ₀) / (σ / √n)。',
    importance: '比例检验（如电商 A/B 测试转化率比较）和已知总体方差时的基础检验。',
  },
  {
    id: 'anova',
    name: '方差分析 (ANOVA / F 检验)',
    shortTitle: '方差分析 ANOVA',
    aliases: ['ANOVA', '方差分析', 'F 检验', 'F-Test', '单因素方差分析'],
    category: '检验方法',
    quickDef: '用于一次性比较 3 个或更多组样本均值是否存在显著差异的方法，通过比较“组间变异”与“组内变异”的比例（F 值）进行决策。',
    physicalAnalogy: '测量不同声音（组间信号）与房间环境杂音（组内噪声）的比值（信噪比 Signal-to-Noise Ratio）。如果信号显著盖过了杂音，说明不同声音组之间存在本质差异。',
    formulaOrRule: 'F = MS_between / MS_within = (组间平方和/df_between) / (组内平方和/df_within)。',
    importance: '直接对多组进行多次两两 t 检验会导致假阳性膨胀（多重比较谬误），ANOVA 能在一个统一分析中控制整体 α 风险。',
  },
];

export function findStatTerm(query: string): StatTermDefinition | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  
  // Exact match by id or alias or shortTitle
  return STAT_TERMS_DATABASE.find((term) => 
    term.id.toLowerCase() === q ||
    term.shortTitle.toLowerCase() === q ||
    term.name.toLowerCase().includes(q) ||
    term.aliases.some(alias => alias.toLowerCase() === q || alias.toLowerCase().includes(q) || q.includes(alias.toLowerCase()))
  );
}
