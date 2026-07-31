import React, { useState, useEffect, useRef } from 'react';
import { normalPdf, tPdf, tInv, normalInv } from '../utils/stats';
import { ModuleTab } from '../types';
import { StatTerm } from './StatTerm';
import { 
  Info, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  Activity,
  Sliders,
  Maximize2
} from 'lucide-react';

interface ConceptualGuideProps {
  onNavigate: (tab: ModuleTab) => void;
}

export const ConceptualGuide: React.FC<ConceptualGuideProps> = ({ onNavigate }) => {
  const [df, setDf] = useState<number>(3);
  const [showCriticalArea, setShowCriticalArea] = useState<boolean>(true);
  const [alpha, setAlpha] = useState<number>(0.05);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 绘制 t 分布与 Z 分布实图演化对比
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 填充淡雅温润的微黄底色
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // 坐标范围
    const xMin = -4;
    const xMax = 4;
    const yMin = 0;
    const yMax = 0.45;

    const toX = (val: number) => padding + ((val - xMin) / (xMax - xMin)) * plotWidth;
    const toY = (val: number) => height - padding - ((val - yMin) / (yMax - yMin)) * plotHeight;

    // Y 轴网格线与标签
    ctx.strokeStyle = '#E8E2D7';
    ctx.lineWidth = 1;

    for (let y = 0.1; y <= 0.4; y += 0.1) {
      const py = toY(y);
      ctx.beginPath();
      ctx.moveTo(padding, py);
      ctx.lineTo(width - padding, py);
      ctx.stroke();

      ctx.fillStyle = '#8C8476';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(y.toFixed(1), padding - 8, py + 3);
    }

    // X 轴基线
    const y0 = toY(0);
    ctx.strokeStyle = '#E5DFD3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, y0);
    ctx.lineTo(width - padding, y0);
    ctx.stroke();

    // X 轴刻度
    for (let x = -4; x <= 4; x += 1) {
      const px = toX(x);
      ctx.strokeStyle = '#D6C7B2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, y0);
      ctx.lineTo(px, y0 + 4);
      ctx.stroke();

      ctx.fillStyle = '#8C8476';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(x.toString(), px, y0 + 16);
    }

    // 清晰纹理斜线阴影填充
    const fillHatchedRegion = (
      points: Array<{ x: number; y: number }>,
      fillColor = 'rgba(192, 86, 62, 0.16)',
      hatchColor = 'rgba(192, 86, 62, 0.42)'
    ) => {
      if (points.length < 3) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();

      // 底色平滑填充
      ctx.fillStyle = fillColor;
      ctx.fill();

      // 清晰斜线阴影
      ctx.clip();
      ctx.strokeStyle = hatchColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const step = 8;
      for (let pos = -width; pos < width + height; pos += step) {
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos + height, height);
      }
      ctx.stroke();
      ctx.restore();
    };

    // 1. 绘制拒绝域阴影填充 (针对 t 分布)
    if (showCriticalArea) {
      const tc = tInv(1 - alpha / 2, df);

      // 左尾阴影
      const leftPoints: Array<{ x: number; y: number }> = [{ x: toX(-4), y: y0 }];
      for (let x = -4; x <= -tc; x += 0.02) {
        leftPoints.push({ x: toX(x), y: toY(tPdf(x, df)) });
      }
      leftPoints.push({ x: toX(-tc), y: y0 });
      fillHatchedRegion(leftPoints);

      // 右尾阴影
      const rightPoints: Array<{ x: number; y: number }> = [{ x: toX(tc), y: y0 }];
      for (let x = tc; x <= 4; x += 0.02) {
        rightPoints.push({ x: toX(x), y: toY(tPdf(x, df)) });
      }
      rightPoints.push({ x: toX(4), y: y0 });
      fillHatchedRegion(rightPoints);

      // 绘制临界线标记
      ctx.strokeStyle = '#C0563E';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(toX(tc), y0);
      ctx.lineTo(toX(tc), toY(tPdf(tc, df)));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX(-tc), y0);
      ctx.lineTo(toX(-tc), toY(tPdf(-tc, df)));
      ctx.stroke();

      ctx.setLineDash([]);

      // 临界值数值标注
      ctx.fillStyle = '#8C4332';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      if (toX(tc) <= width - padding - 15) {
        ctx.fillText(`+t_c (${tc.toFixed(2)})`, toX(tc), y0 - 8);
      }
      if (toX(-tc) >= padding + 15) {
        ctx.fillText(`-t_c (-${tc.toFixed(2)})`, toX(-tc), y0 - 8);
      }
    }

    // 2. 绘制标准正态分布曲线 N(0, 1) [虚线 - 优雅深麦秆灰/鼠尾草灰]
    ctx.strokeStyle = '#7A7267';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    let first = true;
    for (let x = -4; x <= 4; x += 0.05) {
      const px = toX(x);
      const py = toY(normalPdf(x, 0, 1));
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. 绘制 Student-t 分布曲线 t(df) [实线 - 自然深绿/橄榄绿]
    ctx.strokeStyle = '#3D523E';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    first = true;
    for (let x = -4; x <= 4; x += 0.05) {
      const px = toX(x);
      const py = toY(tPdf(x, df));
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

  }, [df, showCriticalArea, alpha]);

  const zCritVal = normalInv(1 - alpha / 2);
  const tCritVal = tInv(1 - alpha / 2, df);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner Overview */}
      <div className="relative overflow-hidden bg-white rounded-3xl text-slate-800 p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>知识引导模块 · 理论内核</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            厘清统计检验原理及 t 分布与正态分布的演化纽带
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            推断统计学的核心在于用有限的样本去推断未知总体的真实面貌。t 分布与正态分布是这一推断桥梁上的两大奠基石。理解两者的同源异流与渐近收敛关系，是掌握假设检验的根本依据。
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('taxonomy')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <span>体验交互决策树</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('sandbox')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>直接进入 5 步沙盒</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Distribution Evolution Curve Viewer */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">
                动态分布演化试验场：t(df) 逼近 N(0, 1)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              拖动自由度 df 滑块，观察 t 分布如何从“厚尾高变异”渐进演化收敛为标准正态分布。
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalArea}
                onChange={(e) => setShowCriticalArea(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <span>高亮拒绝域 (α = {alpha})</span>
            </label>

            <select
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value={0.10}>α = 0.10</option>
              <option value={0.05}>α = 0.05</option>
              <option value={0.01}>α = 0.01</option>
            </select>
          </div>
        </div>

        {/* Dynamic Controls & Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Canvas Plot Container */}
          <div className="lg:col-span-8 bg-[#FAF8F5] rounded-2xl p-4 flex flex-col items-center border border-[#E5DFD3] shadow-inner space-y-3">
            <canvas
              ref={canvasRef}
              width={650}
              height={320}
              className="w-full max-w-[650px] h-auto rounded-xl border border-[#E8E2D7] shadow-2xs"
            />
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#5A6354]">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-[#7A7267] inline-block" />
                <span className="font-medium text-[#7A7267]">标准正态分布 N(0, 1)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-1 bg-[#3D523E] rounded-full inline-block" />
                <span className="font-bold text-[#2D2A26]">t 分布 (df = {df})</span>
              </div>
              {showCriticalArea && (
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-3.5 bg-[#E8C8BE]/70 border border-[#C0563E] rounded-xs inline-block relative overflow-hidden shadow-2xs">
                    <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,#C0563E_25%,#C0563E_50%,transparent_50%,transparent_75%,#C0563E_75%)] bg-[length:4px_4px] opacity-45" />
                  </span>
                  <span className="text-[#8C4332] font-medium">拒绝域 (α = {alpha})</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Parameters & Live Metrics */}
          <div className="lg:col-span-4 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>样本量 <StatTerm term="自由度" context={{ df, alpha }}>自由度 df (n - 1)</StatTerm></span>
                </label>
                <span className="px-2.5 py-1 text-xs font-mono font-bold bg-blue-600 text-white rounded-md">
                  df = {df}
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={df}
                onChange={(e) => setDf(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>df = 1 (极厚尾)</span>
                <span>df = 15</span>
                <span>df = 50 (极逼近正态)</span>
              </div>
            </div>

            {/* Comparison Statistics Output */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                双侧临界值 (α = {alpha}) 对比
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[11px] font-sans text-slate-500 font-semibold">Z 临界值 (固定)</div>
                  <div className="text-base font-bold text-slate-800">
                    ±{zCritVal.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">对应标准正态分布</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[11px] font-sans text-blue-600 font-semibold">t 临界值 (动态)</div>
                  <div className="text-base font-bold text-blue-600">
                    ±{tCritVal.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    差值: +{(tCritVal - zCritVal).toFixed(3)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">物理含义：</span>
                {df < 10 ? (
                  <span>当前样本自由度较小 (df = {df})，t 分布临界门槛高于 Z 检验 (±{tCritVal.toFixed(2)} vs ±{zCritVal.toFixed(2)})，这能严防因样本方差不稳定带来的假阳性风险。</span>
                ) : df < 30 ? (
                  <span>自由度增加至 df = {df}，t 分布尾部变薄，临界值逼近正态分布门槛。</span>
                ) : (
                  <span>df = {df} ≥ 30，根据中心极限定理，t 分布与正态分布已几乎重合！</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 公式与原理深度对比：样本 t 分布 vs 样本均值正态分布 (σ vs s) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>核心数学原理对比</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              样本 t 分布 vs 样本均值正态分布（<span className="text-blue-600 font-serif font-bold italic">s</span> vs <span className="text-emerald-600 font-serif font-bold italic">σ</span> 公式对照）
            </h3>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              推断统计学中最关键的技术转折点：当总体标准差 <span className="font-serif italic font-bold text-emerald-700">σ</span> 未知时，我们不得不使用样本标准差 <span className="font-serif italic font-bold text-blue-700">s</span> 估算标准误，这直接促成了从“正态 Z 分布”向“厚尾 t 分布”的蜕变。
            </p>
          </div>
        </div>

        {/* 公式对比双卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 左卡片：样本均值正态分布 (Z) */}
          <div className="p-6 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-white rounded-2xl border border-emerald-200/80 space-y-4 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-bl-xl tracking-wider uppercase">
              总体标准差 σ 已知 (Known)
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">1. 样本均值正态分布 (Z 检验)</span>
              <h4 className="text-base font-extrabold text-slate-900">标准正态分布公式 N(0, 1)</h4>
            </div>

            {/* LaTeX 数学公式框 */}
            <div className="p-4 bg-slate-900 text-emerald-300 rounded-xl font-serif text-center text-lg sm:text-xl font-bold shadow-inner tracking-wide border border-slate-800">
              {"Z = (X̄ - μ₀) / (σ / √n)  ~  N(0, 1)"}
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900">分母标准误 (SE)：</strong>
                  <span className="font-serif italic font-semibold">SE = σ / √n</span>。其中总体标准差 <span className="font-serif italic font-bold text-emerald-700">σ</span> 为固定的真实常数，不含任何抽样随机性。
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900">不确定性来源：</strong>
                  仅存在<strong className="text-emerald-700">单重不确定性</strong>（分子样本均值 <span className="font-serif italic">X̄</span> 的抽样波动）。
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900">临界门槛特点：</strong>
                  分布形状固定不变，双侧 α = 0.05 对应临界值为固定的 <strong className="font-mono text-emerald-800">±1.960</strong>。
                </p>
              </div>
            </div>
          </div>

          {/* 右卡片：样本 t 分布 (t) */}
          <div className="p-6 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white rounded-2xl border border-indigo-200/80 space-y-4 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded-bl-xl tracking-wider uppercase">
              总体标准差 σ 未知 (用 s 估计)
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">2. 样本 t 分布 (Student's t-Test)</span>
              <h4 className="text-base font-extrabold text-slate-900">Student-t 分布公式 t(df)</h4>
            </div>

            {/* LaTeX 数学公式框 */}
            <div className="p-4 bg-slate-900 text-indigo-300 rounded-xl font-serif text-center text-lg sm:text-xl font-bold shadow-inner tracking-wide border border-slate-800">
              {"t = (X̄ - μ₀) / (s / √n)  ~  t(df = n - 1)"}
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900">分母估计标准误 (SE)：</strong>
                  <span className="font-serif italic font-semibold">SE = s / √n</span>。其中样本标准差 <span className="font-serif italic font-bold text-indigo-700">s = √(Σ(Xᵢ - X̄)² / (n - 1))</span>。
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900">不确定性来源：</strong>
                  具有<strong className="text-indigo-700">双重不确定性 (Double Uncertainty)</strong>——分子 <span className="font-serif italic">X̄</span> 与分母 <span className="font-serif italic">s</span> 均为随机变量！
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <p>
                  <strong className="text-slate-900">“厚尾”现象成因：</strong>
                  当偶遇小样本算出偏小的 <span className="font-serif italic">s</span> 时，分母变小拉大 <span className="font-serif italic">t</span> 值，产生更高的极端概率，导致临界门槛升高（如 df=3 时 <strong className="font-mono text-indigo-800">±3.182 &gt; ±1.960</strong>）。
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* σ 与 s 核心维度对比表 */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>公式参数核心差异对照表：σ (总体真值) vs s (样本估计量)</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-200/70 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="px-3.5 py-2.5 rounded-tl-xl">比较维度</th>
                  <th className="px-3.5 py-2.5 text-emerald-800">总体标准差 σ (Z 分布)</th>
                  <th className="px-3.5 py-2.5 text-indigo-800 rounded-tr-xl">样本标准差 s (t 分布)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-800 bg-slate-50">统计学身份</td>
                  <td className="px-3.5 py-2.5 text-slate-700">总体真值参数 (Parameter)</td>
                  <td className="px-3.5 py-2.5 text-indigo-900 font-medium">样本统计量 (Statistic)，无偏估计量</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-800 bg-slate-50">抽样波动性</td>
                  <td className="px-3.5 py-2.5 text-slate-700">恒定已知常数 (无随机波动)</td>
                  <td className="px-3.5 py-2.5 text-indigo-900 font-medium">随每次随机抽样而改变 (具随机波动)</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-800 bg-slate-50">自由度依赖 (df)</td>
                  <td className="px-3.5 py-2.5 text-slate-700">不依赖自由度 (固定为 Z 分布)</td>
                  <td className="px-3.5 py-2.5 text-indigo-900 font-medium font-mono">依赖自由度 df = n - 1 (计算 s 消耗 1 个自由度)</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-800 bg-slate-50">渐进收敛特性</td>
                  <td className="px-3.5 py-2.5 text-slate-700">基准曲线 (Standard Benchmark)</td>
                  <td className="px-3.5 py-2.5 text-indigo-900 font-medium">当 n → ∞ 时，s 依概率收敛于 σ，t(df) → N(0, 1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3 Major Comparison Slice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Slice Card 1 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
            1
          </div>
          <h4 className="text-base font-bold text-slate-800">
            联系与结构对称性
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            两者均为**单峰、对称的“钟形”概率分布**，均值、中位数和众数完全重合于中心原点 x = 0。它们代表了连续随机变量在标准化之后的最基础分布形态。
          </p>
          <div className="pt-2 text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            分布中心: E(X) = 0, 对称轴: x = 0
          </div>
        </div>

        {/* Slice Card 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
            2
          </div>
          <h4 className="text-base font-bold text-slate-800">
            t 分布的“厚尾”（Heavy-Tailed）特征
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            小样本情况下，总体方差 σ² 未知，只能使用样本方差 s² 替代。由于 s 自身带有随机波动，为标准分布引入了**额外的不确定性**，导致 t 分布两端尾部比正态分布更厚，极限异常值概率更高。
          </p>
          <div className="pt-2 text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            t = (x̄ - μ) / (s / √n)  [s引入额外随机性]
          </div>
        </div>

        {/* Slice Card 3 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
            3
          </div>
          <h4 className="text-base font-bold text-slate-800">
            中心极限定理与渐进收敛
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            根据**中心极限定理 (CLT)**，随着自由度 df = n - 1 增大，样本标准差 s 依概率收敛于总体标准差 σ。当 df → ∞（通常 n ≥ 30）时，t 分布无限逼近标准正态分布 N(0, 1)。
          </p>
          <div className="pt-2 text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            lim (df → ∞) t(df) = N(0, 1)
          </div>
        </div>
      </div>

      {/* Z 检验 vs t 检验应用对比表格 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>假设检验应用场景对比：Z 检验 vs t 检验</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 rounded-tl-xl">对比维度</th>
                <th className="px-4 py-3 text-slate-800">Z 检验 (Z-Test)</th>
                <th className="px-4 py-3 text-blue-700 rounded-tr-xl">t 检验 (t-Test)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 bg-slate-50">总体标准差 σ</td>
                <td className="px-4 py-3 font-medium text-slate-700">已知 (Known)</td>
                <td className="px-4 py-3 font-medium text-blue-700">未知 (Unknown, 用样本 s 估计)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 bg-slate-50">适用样本量 n</td>
                <td className="px-4 py-3">大样本 (n ≥ 30) 或方差已知</td>
                <td className="px-4 py-3">小样本 (n &lt; 30) 且方差未知</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 bg-slate-50">临界值形态</td>
                <td className="px-4 py-3 font-mono">固定 (如 α=0.05 双侧为 ±1.96)</td>
                <td className="px-4 py-3 font-mono">随自由度 df = n - 1 动态变化</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 bg-slate-50">保守度与拒绝域门槛</td>
                <td className="px-4 py-3">相对激进（门槛较低）</td>
                <td className="px-4 py-3 font-semibold text-blue-700">更加保守（拒绝域门槛更高，防假阳性）</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
