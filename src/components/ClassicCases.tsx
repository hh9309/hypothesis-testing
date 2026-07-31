import React, { useState } from 'react';
import { ClassicCase, TestInputData, ModuleTab } from '../types';
import { FileText, Play, ArrowRight, Database, CheckCircle2, BarChart2 } from 'lucide-react';

interface ClassicCasesProps {
  onLoadCase: (inputData: TestInputData) => void;
  onNavigate: (tab: ModuleTab) => void;
}

export const ClassicCases: React.FC<ClassicCasesProps> = ({ onLoadCase, onNavigate }) => {
  const classicCases: ClassicCase[] = [
    {
      id: 'case_drug',
      title: '案例 1：心血管降压新药临床疗效评估 (配对 t 检验)',
      category: 't_test',
      testType: 't_paired',
      bgDescription: '某种针对高血压患者的新型血管紧张素抑制剂在 II 期临床试验中，招募了 10 名患者，记录服药前与连续服药 4 周后的收缩压 (mmHg)。',
      datasetDescription: '包含 10 名患者服药前后的配对收缩压测量值。',
      dataInput: {
        testType: 't_paired',
        alternative: 'greater',
        alpha: 0.05,
        nullValue: 0,
        group1Name: '服药前收缩压',
        group1DataRaw: [152, 148, 160, 155, 142, 158, 165, 150, 146, 154],
        group2Name: '服药后收缩压',
        group2DataRaw: [138, 135, 145, 142, 130, 141, 148, 136, 132, 139]
      },
      insights: '临床经验法则：若收缩压平均降低 > 10 mmHg 且 p < 0.05，则该药具备明确治疗价值。'
    },
    {
      id: 'case_ab',
      title: '案例 2：电商平台结账页 A/B 测试转化率分析 (双样本 Z 检验)',
      category: 'z_test',
      testType: 'z_proportion_two',
      bgDescription: '某知名电商平台重新设计了极简结账流程 (版本 B)，并与原有的传统多步骤结账流程 (版本 A) 进行为期一周的流量对等 A/B 测试。',
      datasetDescription: '版本 A (3000 人流，270 次购买) vs 版本 B (3000 人流，360 次购买)。',
      dataInput: {
        testType: 'z_proportion_two',
        alternative: 'two_sided',
        alpha: 0.05,
        nullValue: 0,
        x1: 360,
        n1: 3000,
        x2: 270,
        n2: 3000
      },
      insights: '版本 B 转化率提升至 12.0% (版本 A 为 9.0%)，统计显著性达成，预计全量上线可年增创收千万元。'
    },
    {
      id: 'case_chi2',
      title: '案例 3：智能音箱外观颜色与用户性别偏好关联 (卡方独立性检验)',
      category: 'chi2_test',
      testType: 'chi2_independence',
      bgDescription: '消费电子公司调研了 200 名潜在购买者的性别与对三款限定配色（深空灰、极光白、玫瑰金）的偏好分类数据。',
      datasetDescription: '2×3 交叉分类列联表数据。',
      dataInput: {
        testType: 'chi2_independence',
        alternative: 'two_sided',
        alpha: 0.05,
        nullValue: 0,
        contingencyTable: [
          [55, 35, 10], // 男性偏好 [深空灰, 极光白, 玫瑰金]
          [20, 45, 35]  // 女性偏好
        ],
        rowLabels: ['男性用户', '女性用户'],
        colLabels: ['深空灰', '极光白', '玫瑰金']
      },
      insights: '卡方检验检测性别与配色偏好是否存在显着依赖性，指导供应链精准备货。'
    },
    {
      id: 'case_f_anova',
      title: '案例 4：精密数控车床加工精度稳定性波动 (双样本 F 检验)',
      category: 'f_test',
      testType: 'f_two_variance',
      bgDescription: '工业制造车间引入新式刀具 (设备 B) 替代旧式刀具 (设备 A)，需要评估新刀具加工轴承外径的公差尺寸波动度（方差）。',
      datasetDescription: '设备 A 抽样 15 件，设备 B 抽样 15 件轴承外径公差。',
      dataInput: {
        testType: 'f_two_variance',
        alternative: 'two_sided',
        alpha: 0.05,
        nullValue: 0,
        group1DataRaw: [20.05, 20.12, 19.88, 20.25, 19.92, 20.18, 20.30, 19.80, 20.15, 20.22, 19.85, 20.28, 19.90, 20.10, 20.20],
        group2DataRaw: [20.01, 20.03, 19.98, 20.02, 19.99, 20.04, 20.02, 19.97, 20.01, 20.05, 19.98, 20.03, 19.99, 20.02, 20.01]
      },
      insights: '设备 B 方差显著低于设备 A，证明新刀具大幅提高了加工稳定度！'
    }
  ];

  const [selectedCase, setSelectedCase] = useState<ClassicCase>(classicCases[0]);

  const handleLoad = (c: ClassicCase) => {
    onLoadCase(c.dataInput);
    onNavigate('sandbox');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-2">
        <div className="flex items-center space-x-2 text-[#7D8E7E]">
          <FileText className="w-6 h-6" />
          <h2 className="text-xl font-bold text-[#5A6354]">
            经典实战案例库 (Classic Case Studies)
          </h2>
        </div>
        <p className="text-xs text-[#7A7267]">
          涵盖新药临床疗效、电商 A/B 测试、消费偏好分类与工业质量控制等四大真实行业场景。一键载入数据至 5 步沙盒推导。
        </p>
      </div>

      {/* Case Select Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {classicCases.map((c) => {
          const isSelected = selectedCase.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                isSelected
                  ? 'bg-white border-[#7D8E7E] shadow-xs ring-2 ring-[#7D8E7E]/20'
                  : 'bg-white border-[#E5DFD3] hover:border-[#D6C7B2]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-bold text-[#7D8E7E] bg-[#F2EDE4] border border-[#E5DFD3] rounded-md uppercase">
                  {c.category}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#7D8E7E]" />}
              </div>

              <h3 className="text-xs font-bold text-[#3D3D3D] line-clamp-2 leading-snug">
                {c.title}
              </h3>

              <p className="text-[11px] text-[#7A7267] line-clamp-2">
                {c.bgDescription}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Case Detail Viewer */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD3] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#3D3D3D]">
              {selectedCase.title}
            </h3>
            <p className="text-xs text-[#7A7267] mt-1">
              {selectedCase.bgDescription}
            </p>
          </div>

          <button
            onClick={() => handleLoad(selectedCase)}
            className="px-4 py-2 bg-[#7D8E7E] hover:bg-[#6C7D6D] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>一键导入沙盒推导</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dataset Preview */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#5A6354] uppercase flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-[#7D8E7E]" />
            <span>案例数据集样本预览</span>
          </h4>

          {selectedCase.dataInput.group1DataRaw && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5DFD3] space-y-1">
                <div className="font-sans font-bold text-[#5A6354]">{selectedCase.dataInput.group1Name || '组 1 样本'}</div>
                <div className="text-[#3D3D3D] break-all">{JSON.stringify(selectedCase.dataInput.group1DataRaw)}</div>
              </div>

              {selectedCase.dataInput.group2DataRaw && (
                <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5DFD3] space-y-1">
                  <div className="font-sans font-bold text-[#5A6354]">{selectedCase.dataInput.group2Name || '组 2 样本'}</div>
                  <div className="text-[#3D3D3D] break-all">{JSON.stringify(selectedCase.dataInput.group2DataRaw)}</div>
                </div>
              )}
            </div>
          )}

          {selectedCase.dataInput.contingencyTable && (
            <div className="overflow-x-auto bg-[#F9F7F2] p-4 rounded-2xl border border-[#E5DFD3]">
              <table className="w-full text-xs text-center text-[#3D3D3D] font-mono">
                <thead>
                  <tr className="border-b border-[#E5DFD3] font-bold font-sans text-[#5A6354]">
                    <th className="p-2 text-left">属性</th>
                    {selectedCase.dataInput.colLabels?.map((cl) => (
                      <th key={cl} className="p-2">{cl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedCase.dataInput.contingencyTable.map((row, i) => (
                    <tr key={i} className="border-b border-[#E5DFD3]/60">
                      <td className="p-2 font-bold font-sans text-left text-[#5A6354]">
                        {selectedCase.dataInput.rowLabels?.[i] || `行 ${i + 1}`}
                      </td>
                      {row.map((val, j) => (
                        <td key={j} className="p-2">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Domain Insight Box */}
        <div className="p-4 bg-[#F4F7F4] rounded-2xl border border-[#C8D6C9] text-xs text-[#3D523E] leading-relaxed space-y-1">
          <div className="font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-[#7D8E7E]" />
            <span>行业业务洞察要点：</span>
          </div>
          <p>{selectedCase.insights}</p>
        </div>
      </div>
    </div>
  );
};
