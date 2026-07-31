/**
 * 假设检验与推断统计智能实验室 - 类型定义
 */

export type ModuleTab = 
  | 'guide'        // 1. 知识引导模块
  | 'taxonomy'     // 2. 检验类别与决策树
  | 'sandbox'      // 3. 5大步骤沙盒
  | 'distribution' // 4. 动态分布与两类错误沙盒
  | 'cases'        // 5. 经典案例模块
  | 'python'       // 6. Python验证模块
  | 'ai'           // 7. AI 洞察模块
  | 'report';      // 8. 报告导出模块

export type TestCategory = 'z_test' | 't_test' | 'chi2_test' | 'f_test';

export type SpecificTestType = 
  | 'z_one_sample'        // 单样本 Z 检验
  | 'z_two_sample'        // 独立双样本 Z 检验
  | 'z_proportion_one'    // 单比例 Z 检验
  | 'z_proportion_two'    // 双比例 Z 检验
  | 't_one_sample'        // 单样本 t 检验
  | 't_two_sample_ind'    // 独立双样本 t 检验
  | 't_paired'            // 配对样本 t 检验
  | 'chi2_gof'            // 卡方拟合优度检验
  | 'chi2_independence'   // 卡方独立性检验
  | 'f_two_variance'      // 双样本方差比 F 检验
  | 'f_anova_one_way';    // 单因素方差分析 ANOVA

export type AlternativeHypothesis = 'two_sided' | 'greater' | 'less';

export interface TestInputData {
  testType: SpecificTestType;
  alternative: AlternativeHypothesis;
  alpha: number; // 0.05, 0.01, 0.10
  
  // 单样本参数
  nullValue: number; // H0 中的 μ0 或 p0
  sampleDataRaw?: number[]; // 原始数据数组
  sampleMean?: number;
  sampleSd?: number;
  sampleSize?: number;
  popSdKnown?: number; // Z 检验已知总体标准差 σ

  // 双样本参数
  group1Name?: string;
  group1DataRaw?: number[];
  group1Mean?: number;
  group1Sd?: number;
  group1Size?: number;

  group2Name?: string;
  group2DataRaw?: number[];
  group2Mean?: number;
  group2Sd?: number;
  group2Size?: number;

  // 比例检验参数
  x1?: number; // 成功数 1
  n1?: number; // 样本量 1
  x2?: number; // 成功数 2
  n2?: number; // 样本量 2

  // 卡方独立性检验列联表
  contingencyTable?: number[][];
  rowLabels?: string[];
  colLabels?: string[];

  // 卡方拟合优度
  observedFreqs?: number[];
  expectedFreqs?: number[];

  // ANOVA 多组数据
  anovaGroupsData?: { name: string; values: number[] }[];
}

export interface HypothesisResult {
  testType: SpecificTestType;
  testName: string;
  h0Text: string;
  h1Text: string;
  statisticName: 'Z' | 't' | 'χ²' | 'F';
  statisticValue: number;
  df: number | [number, number];
  pValue: number;
  alpha: number;
  criticalValue: number | [number, number];
  rejectH0: boolean;
  effectSizeName?: string;
  effectSizeValue?: number;
  confidenceInterval?: [number, number];
  apaFormat: string;
  interpretation: string;
}

export interface ClassicCase {
  id: string;
  title: string;
  category: TestCategory;
  testType: SpecificTestType;
  bgDescription: string;
  datasetDescription: string;
  dataInput: TestInputData;
  insights: string;
}

export interface AssumptionCheckResult {
  normality: {
    passed: boolean;
    statisticName: string;
    statisticValue: number;
    pValue: number;
    message: string;
  };
  homogeneity: {
    passed: boolean;
    statisticName: string;
    statisticValue: number;
    pValue: number;
    message: string;
  };
  independence: {
    passed: boolean;
    message: string;
  };
}

export interface AIReportData {
  testResult: HypothesisResult;
  inputData: TestInputData;
  assumptions: AssumptionCheckResult;
  aiMarkdownText?: string;
  generatedAt?: string;
}
