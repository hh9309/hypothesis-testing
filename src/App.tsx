import React, { useState } from 'react';
import { ModuleTab, TestInputData, SpecificTestType } from './types';
import { Navbar } from './components/Navbar';
import { ConceptualGuide } from './components/ConceptualGuide';
import { TestingTaxonomyTree } from './components/TestingTaxonomyTree';
import { StepSandbox } from './components/StepSandbox';
import { DistributionErrorSandbox } from './components/DistributionErrorSandbox';
import { ClassicCases } from './components/ClassicCases';
import { PythonSandbox } from './components/PythonSandbox';
import { AIInsightsModule } from './components/AIInsightsModule';
import { ReportExportModule } from './components/ReportExportModule';
import { StatGlossaryModal } from './components/StatGlossaryModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ModuleTab>('guide');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // 共享大模型生成文本
  const [aiText, setAiText] = useState<string>('');

  // 全局共享检验参数状态
  const [inputData, setInputData] = useState<TestInputData>({
    testType: 't_one_sample',
    alternative: 'two_sided',
    alpha: 0.05,
    nullValue: 100,
    sampleMean: 102,
    sampleSd: 12,
    sampleSize: 15,
    group1Name: '实验组',
    group1Mean: 105,
    group1Sd: 10,
    group1Size: 20,
    group2Name: '对照组',
    group2Mean: 98,
    group2Sd: 12,
    group2Size: 20,
    x1: 45,
    n1: 300,
    x2: 25,
    n2: 300,
  });

  // 重置所有参数
  const handleResetAll = () => {
    setInputData({
      testType: 't_one_sample',
      alternative: 'two_sided',
      alpha: 0.05,
      nullValue: 100,
      sampleMean: 102,
      sampleSd: 12,
      sampleSize: 15,
      group1Name: '实验组',
      group1Mean: 105,
      group1Sd: 10,
      group1Size: 20,
      group2Name: '对照组',
      group2Mean: 98,
      group2Sd: 12,
      group2Size: 20,
      x1: 45,
      n1: 300,
      x2: 25,
      n2: 300,
    });
  };

  // 从决策树选择检验并导入沙盒
  const handleSelectTestFromTree = (testType: SpecificTestType) => {
    setInputData((prev) => ({
      ...prev,
      testType,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetAll={handleResetAll}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'guide' && (
          <ConceptualGuide onNavigate={setActiveTab} />
        )}

        {activeTab === 'taxonomy' && (
          <TestingTaxonomyTree
            onSelectTest={handleSelectTestFromTree}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'sandbox' && (
          <StepSandbox
            inputData={inputData}
            setInputData={setInputData}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'distribution' && (
          <DistributionErrorSandbox />
        )}

        {activeTab === 'cases' && (
          <ClassicCases
            onLoadCase={(data) => setInputData(data)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'python' && (
          <PythonSandbox inputData={inputData} />
        )}

        {activeTab === 'ai' && (
          <AIInsightsModule
            inputData={inputData}
            aiText={aiText}
            setAiText={setAiText}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && (
          <ReportExportModule
            inputData={inputData}
            aiText={aiText}
            onNavigateToAI={() => setActiveTab('ai')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#F2EDE4] border-t border-[#E5DFD3] py-4 text-center text-xs text-[#8C8476] print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          假设检验与推断统计智能实验室 — 概念引导 · 决策树 · 5步沙盒 · 错误博弈 · 案例分析 · Python验证 · AI洞察 · 报告导出
        </div>
      </footer>

      {/* Global Stat Term Glossary Modal */}
      <StatGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
