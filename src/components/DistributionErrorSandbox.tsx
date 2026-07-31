import React, { useState, useEffect, useRef } from 'react';
import { normalPdf, normalCdf, normalInv } from '../utils/stats';
import { StatTerm } from './StatTerm';
import { Sliders, Activity, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export const DistributionErrorSandbox: React.FC = () => {
  // 两类错误博弈参数
  const [alpha, setAlpha] = useState<number>(0.05);
  const [effectSize, setEffectSize] = useState<number>(0.5); // Cohen's d (0.1 - 1.5)
  const [sampleSize, setSampleSize] = useState<number>(30); // n (5 - 200)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 计算偏移量 delta = d * sqrt(n)
  const delta = effectSize * Math.sqrt(sampleSize);
  
  // 临界值 (双侧右半边 / 单侧)
  const zCrit = normalInv(1 - alpha); // 以单侧检验展示重叠博弈

  // 第一类错误 α
  const alphaProb = alpha;

  // 第二类错误 β = P(Z < zCrit | H1) = Phi(zCrit - delta)
  const betaProb = normalCdf(zCrit - delta);

  // 统计功效 Power = 1 - β
  const powerProb = 1 - betaProb;

  // 渲染 H0 与 H1 双分布重叠博弈图
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

    const padding = 45;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // X 轴范围涵盖 H0 与 H1 分布 (-4 到 delta + 4)
    const xMin = -4;
    const xMax = Math.max(6, delta + 4);
    const yMin = 0;
    const yMax = 0.45;

    const toX = (val: number) => padding + ((val - xMin) / (xMax - xMin)) * plotWidth;
    const toY = (val: number) => height - padding - ((val - yMin) / (yMax - yMin)) * plotHeight;

    const y0 = toY(0);

    // 1. 基线与刻度
    ctx.strokeStyle = '#E5DFD3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, y0);
    ctx.lineTo(width - padding, y0);
    ctx.stroke();

    // 刻度标尺
    ctx.fillStyle = '#8C8476';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const tickStep = (xMax - xMin) > 12 ? 2 : 1;
    for (let tick = Math.ceil(xMin); tick <= Math.floor(xMax); tick += tickStep) {
      const tx = toX(tick);
      ctx.strokeStyle = '#D6C7B2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, y0);
      ctx.lineTo(tx, y0 + 4);
      ctx.stroke();
      ctx.fillText(`${tick}`, tx, y0 + 16);
    }

    // 多边形阴影渲染函数
    const fillHatchedRegion = (
      points: Array<{ x: number; y: number }>,
      fillColor: string,
      hatchColor: string,
      hatchAngle: 'left' | 'right' = 'right',
      step = 8
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
      if (hatchAngle === 'right') {
        for (let pos = -width; pos < width + height; pos += step) {
          ctx.moveTo(pos, 0);
          ctx.lineTo(pos + height, height);
        }
      } else {
        for (let pos = -width; pos < width + height; pos += step) {
          ctx.moveTo(pos, height);
          ctx.lineTo(pos + height, 0);
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    // 2. 填充功效 Power 区域 (x >= zCrit under H1)
    const powerPoints: Array<{ x: number; y: number }> = [{ x: toX(zCrit), y: y0 }];
    for (let x = zCrit; x <= xMax; x += 0.05) {
      powerPoints.push({ x: toX(x), y: toY(normalPdf(x, delta, 1)) });
    }
    powerPoints.push({ x: toX(xMax), y: y0 });
    fillHatchedRegion(
      powerPoints,
      'rgba(61, 82, 62, 0.12)',
      'rgba(61, 82, 62, 0.35)',
      'right',
      9
    );

    // 3. 填充第二类错误 β 区域 (x < zCrit under H1)
    const betaPoints: Array<{ x: number; y: number }> = [{ x: toX(xMin), y: y0 }];
    for (let x = xMin; x <= zCrit; x += 0.05) {
      betaPoints.push({ x: toX(x), y: toY(normalPdf(x, delta, 1)) });
    }
    betaPoints.push({ x: toX(zCrit), y: y0 });
    fillHatchedRegion(
      betaPoints,
      'rgba(122, 114, 103, 0.15)',
      'rgba(122, 114, 103, 0.45)',
      'left',
      8
    );

    // 4. 填充第一类错误 α 区域 (x >= zCrit under H0)
    const alphaPoints: Array<{ x: number; y: number }> = [{ x: toX(zCrit), y: y0 }];
    for (let x = zCrit; x <= xMax; x += 0.05) {
      alphaPoints.push({ x: toX(x), y: toY(normalPdf(x, 0, 1)) });
    }
    alphaPoints.push({ x: toX(xMax), y: y0 });
    fillHatchedRegion(
      alphaPoints,
      'rgba(192, 86, 62, 0.20)',
      'rgba(192, 86, 62, 0.55)',
      'right',
      7
    );

    // 5. 绘制 H0 分布曲线 (正态 N(0, 1) - 砖红/赤陶色)
    ctx.strokeStyle = '#C0563E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let x = xMin; x <= xMax; x += 0.05) {
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

    // 6. 绘制 H1 分布曲线 (正态 N(delta, 1) - 深青蓝/鼠尾草绿)
    ctx.strokeStyle = '#3D523E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    first = true;
    for (let x = xMin; x <= xMax; x += 0.05) {
      const px = toX(x);
      const py = toY(normalPdf(x, delta, 1));
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // 7. H0 与 H1 峰值文字标注
    const pyH0Max = toY(normalPdf(0, 0, 1));
    const pyH1Max = toY(normalPdf(delta, delta, 1));
    
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    
    // H0 标签
    ctx.fillStyle = '#C0563E';
    ctx.fillText('H₀ 分布', toX(0), pyH0Max - 10);

    // H1 标签
    ctx.fillStyle = '#3D523E';
    ctx.fillText('H₁ 分布', toX(delta), pyH1Max - 10);

    // 8. 绘制临界分割线 (zCrit Line)
    const pxCrit = toX(zCrit);
    ctx.strokeStyle = '#2D2A26';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(pxCrit, y0);
    ctx.lineTo(pxCrit, toY(0.42));
    ctx.stroke();
    ctx.setLineDash([]);

    // 临界线文本框
    const critLabel = `临界值 Zc = ${zCrit.toFixed(2)}`;
    ctx.font = 'bold 10px sans-serif';
    const tw = ctx.measureText(critLabel).width + 12;
    ctx.fillStyle = '#2D2A26';
    ctx.roundRect(pxCrit - tw / 2, toY(0.43) - 14, tw, 18, 5);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(critLabel, pxCrit, toY(0.43) - 2);

  }, [alpha, effectSize, sampleSize, delta, zCrit]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-2">
        <div className="flex items-center space-x-2 text-[#7D8E7E]">
          <Sliders className="w-6 h-6" />
          <h2 className="text-xl font-bold text-[#5A6354]">
            动态分布与两类错误博弈沙盒 (Distribution & Errors Sandbox)
          </h2>
        </div>
        <p className="text-xs text-[#7A7267]">
          假设检验本质上是原假设分布 H₀ 与备择假设分布 H₁ 的重叠博弈。调整显著性水平 α、效应量 d 或样本量 n，实时观察第 I 类错误（弃真 α）、第 II 类错误（取伪 β）与统计功效（1 - β）的消长变化。
        </p>
      </div>

      {/* Main Canvas & Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Canvas Overlap Plot */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
            <h3 className="text-sm font-bold text-[#5A6354] flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#7D8E7E]" />
              <span>双分布重叠博弈与决策划分图</span>
            </h3>
            <span className="text-xs font-mono font-bold text-[#5A6354] bg-[#F2EDE4] px-2.5 py-1 rounded-lg border border-[#E5DFD3]">
              偏移量 δ = d × √n = {delta.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#FAF8F5] rounded-2xl p-4 flex flex-col items-center border border-[#E5DFD3] shadow-inner space-y-3">
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="w-full max-w-[600px] h-auto rounded-xl border border-[#E8E2D7] shadow-2xs"
            />

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#5A6354]">
              {/* α 弃真 */}
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-3.5 bg-[#E8C8BE]/70 border border-[#C0563E] rounded-xs inline-block relative overflow-hidden shadow-2xs">
                  <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,#C0563E_25%,#C0563E_50%,transparent_50%,transparent_75%,#C0563E_75%)] bg-[length:4px_4px] opacity-45" />
                </span>
                <span className="font-medium text-[#7A7267]">
                  α 弃真 (α = {(alphaProb * 100).toFixed(1)}%)
                </span>
              </div>

              {/* β 取伪 */}
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-3.5 bg-[#DED9D2] border border-[#7A7267] rounded-xs inline-block relative overflow-hidden shadow-2xs">
                  <span className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,#7A7267_25%,#7A7267_50%,transparent_50%,transparent_75%,#7A7267_75%)] bg-[length:4px_4px] opacity-40" />
                </span>
                <span className="font-medium text-[#7A7267]">
                  β 取伪 (β = {(betaProb * 100).toFixed(1)}%)
                </span>
              </div>

              {/* 功效 Power */}
              <div className="flex items-center space-x-1.5">
                <span className="w-4 h-3.5 bg-[#C8D6C9]/70 border border-[#3D523E] rounded-xs inline-block relative overflow-hidden shadow-2xs">
                  <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,#3D523E_25%,#3D523E_50%,transparent_50%,transparent_75%,#3D523E_75%)] bg-[length:4px_4px] opacity-35" />
                </span>
                <span className="font-bold text-[#3D523E]">
                  功效 Power (1-β = {(powerProb * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Sliders & Power Cards */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sliders Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-5">
            <h3 className="text-sm font-bold text-[#5A6354] border-b border-[#E5DFD3] pb-3">
              博弈调节三杠杆 (Parameters)
            </h3>

            {/* Slider 1: Alpha */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-[#5A6354]">
                  1. <StatTerm term="第一类错误" context={{ alpha, beta: betaProb, power: powerProb }}>显著性水平 α (第一类错误容忍上限)</StatTerm>
                </label>
                <span className="font-mono font-bold text-[#C99B8B]">α = {alpha}</span>
              </div>
              <input
                type="range"
                min={0.001}
                max={0.20}
                step={0.005}
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-[#C99B8B] cursor-pointer"
              />
            </div>

            {/* Slider 2: Effect Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-[#5A6354]">
                  2. <StatTerm term="效应量" context={{ effectSize, sampleSize, power: powerProb }}>效应量 Cohen's d (真实信号强度)</StatTerm>
                </label>
                <span className="font-mono font-bold text-[#7D8E7E]">d = {effectSize.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.5}
                step={0.05}
                value={effectSize}
                onChange={(e) => setEffectSize(parseFloat(e.target.value))}
                className="w-full accent-[#7D8E7E] cursor-pointer"
              />
            </div>

            {/* Slider 3: Sample Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-[#5A6354]">3. 样本容量 n (放大信号降噪器)</label>
                <span className="font-mono font-bold text-[#5A6354]">n = {sampleSize}</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value))}
                className="w-full accent-[#5A6354] cursor-pointer"
              />
            </div>
          </div>

          {/* Metrics Output Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FDF6F0] p-3.5 rounded-2xl border border-[#E8C8BE] text-center space-y-1">
              <div className="text-[10px] font-bold text-[#8C4332] uppercase">
                <StatTerm term="第一类错误" context={{ alpha, beta: betaProb, power: powerProb }}>α 第一类错误</StatTerm>
              </div>
              <div className="text-lg font-mono font-extrabold text-[#8C4332]">
                {(alphaProb * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#8C4332]/80">弃真 (假阳性)</div>
            </div>

            <div className="bg-[#F5F2EC] p-3.5 rounded-2xl border border-[#D6C7B2] text-center space-y-1">
              <div className="text-[10px] font-bold text-[#7A7267] uppercase">
                <StatTerm term="第二类错误" context={{ alpha, beta: betaProb, power: powerProb }}>β 第二类错误</StatTerm>
              </div>
              <div className="text-lg font-mono font-extrabold text-[#3D3D3D]">
                {(betaProb * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#7A7267]">取伪 (假阴性)</div>
            </div>

            <div className="bg-[#F4F7F4] p-3.5 rounded-2xl border border-[#C8D6C9] text-center space-y-1">
              <div className="text-[10px] font-bold text-[#3D523E] uppercase">
                <StatTerm term="统计功效" context={{ alpha, beta: betaProb, power: powerProb }}>统计功效 1-β</StatTerm>
              </div>
              <div className="text-lg font-mono font-extrabold text-[#3D523E]">
                {(powerProb * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#3D523E]/80">真阳性检出率</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
