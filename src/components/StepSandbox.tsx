import React, { useState, useEffect, useRef } from 'react';
import { 
  TestInputData, 
  SpecificTestType, 
  AlternativeHypothesis, 
  HypothesisResult,
  ModuleTab
} from '../types';
import { computeTestResult, tPdf, normalPdf, chi2Pdf, fPdf, tInv, normalInv, chi2Inv, fInv } from '../utils/stats';
import { StatTerm } from './StatTerm';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  Edit3,
  BarChart2,
  FileCode2,
  FileText,
  Copy,
  Check
} from 'lucide-react';

interface StepSandboxProps {
  inputData: TestInputData;
  setInputData: React.Dispatch<React.SetStateAction<TestInputData>>;
  onNavigate: (tab: ModuleTab) => void;
}

export const StepSandbox: React.FC<StepSandboxProps> = ({ inputData, setInputData, onNavigate }) => {
  const [activeStep, setActiveStep] = useState<number>(4); // 默认展示 Step 4 & Step 5
  const [copied, setCopied] = useState<boolean>(false);
  const [ciLevel, setCiLevel] = useState<0.90 | 0.95 | 0.99>(0.95); // 动态置信水平
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 计算当前假设检验完整结果
  const result: HypothesisResult = computeTestResult(inputData);

  // 动态计算点估计值与置信区间参数
  const getConfidenceIntervalData = () => {
    const alpha = 1 - ciLevel;
    let pointEst = 0;
    let se = 0.01;
    let me = 0;
    let lower = 0;
    let upper = 0;
    let nullVal = inputData.nullValue ?? 0;
    let unitLabel = '';

    switch (inputData.testType) {
      case 't_one_sample':
      case 'z_one_sample': {
        const n = inputData.sampleSize ?? 15;
        const mean = inputData.sampleMean ?? 102;
        const sd = inputData.sampleSd ?? 12;
        pointEst = mean;
        se = sd / Math.sqrt(n);
        const crit = inputData.testType === 'z_one_sample' ? normalInv(1 - alpha / 2) : tInv(1 - alpha / 2, Math.max(1, n - 1));
        me = crit * se;
        lower = pointEst - me;
        upper = pointEst + me;
        nullVal = inputData.nullValue ?? 100;
        unitLabel = 'μ';
        break;
      }
      case 't_two_sample_ind':
      case 'z_two_sample': {
        const n1 = inputData.group1Size ?? 20;
        const n2 = inputData.group2Size ?? 20;
        const m1 = inputData.group1Mean ?? 105;
        const m2 = inputData.group2Mean ?? 98;
        const s1 = inputData.group1Sd ?? 10;
        const s2 = inputData.group2Sd ?? 12;
        pointEst = m1 - m2;
        se = Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2);
        const crit = inputData.testType === 'z_two_sample' ? normalInv(1 - alpha / 2) : tInv(1 - alpha / 2, Math.max(1, n1 + n2 - 2));
        me = crit * se;
        lower = pointEst - me;
        upper = pointEst + me;
        nullVal = 0;
        unitLabel = 'μ₁ - μ₂';
        break;
      }
      case 't_paired': {
        const n = inputData.sampleSize ?? 20;
        const meanDiff = inputData.sampleMean ?? 4.5;
        const sdDiff = inputData.sampleSd ?? 6.2;
        pointEst = meanDiff;
        se = sdDiff / Math.sqrt(n);
        const crit = tInv(1 - alpha / 2, Math.max(1, n - 1));
        me = crit * se;
        lower = pointEst - me;
        upper = pointEst + me;
        nullVal = 0;
        unitLabel = 'μ_d';
        break;
      }
      case 'z_proportion_two': {
        const n1 = inputData.n1 ?? 300;
        const n2 = inputData.n2 ?? 300;
        const x1 = inputData.x1 ?? 45;
        const x2 = inputData.x2 ?? 25;
        const p1 = x1 / n1;
        const p2 = x2 / n2;
        pointEst = p1 - p2;
        se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
        const crit = normalInv(1 - alpha / 2);
        me = crit * se;
        lower = pointEst - me;
        upper = pointEst + me;
        nullVal = 0;
        unitLabel = 'p₁ - p₂';
        break;
      }
      case 'f_two_variance': {
        const s1 = inputData.group1Sd ?? 5;
        const s2 = inputData.group2Sd ?? 3.16;
        const n1 = inputData.group1Size ?? 15;
        const n2 = inputData.group2Size ?? 15;
        const fVal = (s1 * s1) / (s2 * s2);
        pointEst = fVal;
        const df1 = Math.max(1, n1 - 1);
        const df2 = Math.max(1, n2 - 1);
        const fLow = fInv(alpha / 2, df1, df2);
        const fHigh = fInv(1 - alpha / 2, df1, df2);
        lower = fVal / (fHigh || 1);
        upper = fVal / Math.max(0.001, fLow);
        se = (upper - lower) / (2 * normalInv(1 - alpha / 2));
        me = (upper - lower) / 2;
        nullVal = 1.0;
        unitLabel = 'σ₁² / σ₂²';
        break;
      }
      case 'chi2_independence': {
        const table = inputData.contingencyTable || [[35, 15], [20, 30]];
        const total = table.flatMap(r => r).reduce((a, b) => a + b, 0);
        const r = table.length;
        const c = table[0].length;
        let chi2Val = 0;
        const rowSums = table.map(row => row.reduce((a, b) => a + b, 0));
        const colSums = Array(c).fill(0);
        for (let j = 0; j < c; j++) {
          for (let i = 0; i < r; i++) colSums[j] += table[i][j];
        }
        for (let i = 0; i < r; i++) {
          for (let j = 0; j < c; j++) {
            const exp = (rowSums[i] * colSums[j]) / Math.max(1, total);
            chi2Val += Math.pow(table[i][j] - exp, 2) / Math.max(0.001, exp);
          }
        }
        const cramersV = Math.sqrt(chi2Val / (Math.max(1, total) * Math.min(r - 1, c - 1)));
        pointEst = cramersV;
        se = 1 / Math.sqrt(Math.max(1, total));
        me = normalInv(1 - alpha / 2) * se;
        lower = Math.max(0, pointEst - me);
        upper = Math.min(1, pointEst + me);
        nullVal = 0;
        unitLabel = "Cramér's V";
        break;
      }
      case 'f_anova_one_way': {
        const groups = inputData.anovaGroupsData || [
          { name: '组 A', values: [85, 88, 90, 82, 86] },
          { name: '组 B', values: [92, 95, 89, 94, 96] },
          { name: '组 C', values: [78, 80, 84, 82, 79] }
        ];
        const nTotal = groups.reduce((sum, g) => sum + g.values.length, 0);
        const grandMean = groups.flatMap(g => g.values).reduce((a, b) => a + b, 0) / Math.max(1, nTotal);
        let ssBetween = 0;
        let ssWithin = 0;
        groups.forEach(g => {
          const gMean = g.values.reduce((a, b) => a + b, 0) / Math.max(1, g.values.length);
          ssBetween += g.values.length * (gMean - grandMean) ** 2;
          g.values.forEach(v => { ssWithin += (v - gMean) ** 2; });
        });
        const etaSq = ssBetween / Math.max(0.001, ssBetween + ssWithin);
        pointEst = etaSq;
        se = Math.sqrt((4 * etaSq * (1 - etaSq) ** 2) / Math.max(1, nTotal));
        me = normalInv(1 - alpha / 2) * se;
        lower = Math.max(0, pointEst - me);
        upper = Math.min(1, pointEst + me);
        nullVal = 0;
        unitLabel = 'η²';
        break;
      }
      default: {
        pointEst = result.statisticValue;
        se = 0.5;
        me = normalInv(1 - alpha / 2) * se;
        lower = pointEst - me;
        upper = pointEst + me;
        nullVal = 0;
        unitLabel = 'θ';
      }
    }

    const coversNull = lower <= nullVal && upper >= nullVal;
    const intervalWidth = Math.abs(upper - lower);

    return { pointEst, se, me, lower, upper, nullVal, coversNull, intervalWidth, unitLabel };
  };

  const ciData = getConfidenceIntervalData();

  // 复制 APA 格式到剪贴板
  const handleCopyAPA = () => {
    navigator.clipboard.writeText(result.apaFormat);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 保存分布曲线过渡动画的前序物理状态
  const distAnimRef = useRef<{
    statVal: number;
    df1: number;
    df2: number;
  } | null>(null);

  // 动态绘制统计分布曲线，高亮拒绝域（清晰纹理阴影）、临界值与统计量定位，带 requestAnimationFrame 顺滑过渡动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetStat = result.statisticValue;
    const targetDf1 = Array.isArray(result.df) ? result.df[0] : (typeof result.df === 'number' ? result.df : 10);
    const targetDf2 = Array.isArray(result.df) ? result.df[1] : 10;

    if (!distAnimRef.current) {
      distAnimRef.current = { statVal: targetStat, df1: targetDf1, df2: targetDf2 };
    }

    const startStat = distAnimRef.current.statVal;
    const startDf1 = distAnimRef.current.df1;
    const startDf2 = distAnimRef.current.df2;

    const startTime = performance.now();
    const duration = 280; // 280ms 顺滑缓动过渡

    let animId: number;

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic 缓动曲线
      const ease = 1 - Math.pow(1 - progress, 3);

      const currStat = startStat + (targetStat - startStat) * ease;
      const currDf1 = startDf1 + (targetDf1 - startDf1) * ease;
      const currDf2 = startDf2 + (targetDf2 - startDf2) * ease;

      distAnimRef.current = { statVal: currStat, df1: currDf1, df2: currDf2 };

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

    // 填充淡雅温润的微黄底色
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    const padding = 45;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // 决定坐标范围
    let xMin = -4;
    let xMax = 4;
    let getPdf = (x: number) => normalPdf(x);

    if (result.statisticName === 'Z') {
      xMin = -4.5;
      xMax = 4.5;
      getPdf = (x) => normalPdf(x);
    } else if (result.statisticName === 't') {
      const dfVal = Math.max(1, currDf1);
      xMin = -4.5;
      xMax = 4.5;
      getPdf = (x) => tPdf(x, dfVal);
    } else if (result.statisticName === 'χ²') {
      const dfVal = Math.max(1, currDf1);
      xMin = 0;
      xMax = Math.max(15, currStat + 5, dfVal * 2.5);
      getPdf = (x) => chi2Pdf(x, dfVal);
    } else if (result.statisticName === 'F') {
      const df1 = Math.max(1, currDf1);
      const df2 = Math.max(1, currDf2);
      xMin = 0;
      xMax = Math.max(6, currStat + 2);
      getPdf = (x) => fPdf(x, df1, df2);
    }

    const yMin = 0;
    const yMax = 0.45;

    const toX = (val: number) => padding + ((val - xMin) / (xMax - xMin)) * plotWidth;
    const toY = (val: number) => height - padding - ((val - yMin) / (yMax - yMin)) * plotHeight;

    const y0 = toY(0);

    // 1. 坐标网格与基线
    ctx.strokeStyle = '#E5DFD3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, y0);
    ctx.lineTo(width - padding, y0);
    ctx.stroke();

    // 刻度线与文本标尺
    ctx.fillStyle = '#8C8476';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    if (result.statisticName === 'Z' || result.statisticName === 't') {
      for (let tick = -4; tick <= 4; tick += 1) {
        const tx = toX(tick);
        ctx.strokeStyle = '#D6C7B2';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, y0);
        ctx.lineTo(tx, y0 + 4);
        ctx.stroke();
        ctx.fillText(`${tick}`, tx, y0 + 16);
      }
    } else {
      const range = xMax - xMin;
      const tickStep = range > 20 ? 5 : range > 10 ? 2 : 1;
      for (let tick = 0; tick <= xMax; tick += tickStep) {
        const tx = toX(tick);
        ctx.strokeStyle = '#D6C7B2';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, y0);
        ctx.lineTo(tx, y0 + 4);
        ctx.stroke();
        ctx.fillText(`${tick}`, tx, y0 + 16);
      }
    }

    // 2. 绘制拒绝域（带清晰纹理阴影与平滑填充）
    const alpha = result.alpha;

    const fillHatchedRegion = (
      points: Array<{ x: number; y: number }>,
      fillColor = 'rgba(192, 86, 62, 0.16)',
      hatchColor = 'rgba(192, 86, 62, 0.40)'
    ) => {
      if (points.length < 3) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();

      // 底色平滑渲染
      ctx.fillStyle = fillColor;
      ctx.fill();

      // 清晰阴影纹理 (Hatching Lines)
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

    const drawCriticalLine = (critVal: number, labelText: string) => {
      if (critVal < xMin || critVal > xMax) return;
      const cx = toX(critVal);
      const cy = toY(getPdf(critVal));

      ctx.save();
      ctx.strokeStyle = '#C0563E';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, y0);
      ctx.lineTo(cx, Math.max(cy - 10, padding + 5));
      ctx.stroke();

      ctx.fillStyle = '#8C4332';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, cx, y0 - 8);
      ctx.restore();
    };

    if (result.statisticName === 'Z' || result.statisticName === 't') {
      const dfVal = Math.max(1, currDf1);
      const getCrit = (p: number) => (result.statisticName === 'Z' ? normalInv(p) : tInv(p, dfVal));

      if (inputData.alternative === 'two_sided') {
        const cRight = getCrit(1 - alpha / 2);
        const cLeft = -cRight;

        // 左尾拒绝域
        const leftPoints: Array<{ x: number; y: number }> = [{ x: toX(xMin), y: y0 }];
        for (let x = xMin; x <= cLeft; x += 0.02) {
          leftPoints.push({ x: toX(x), y: toY(getPdf(x)) });
        }
        leftPoints.push({ x: toX(cLeft), y: y0 });
        fillHatchedRegion(leftPoints);
        drawCriticalLine(cLeft, `c₁ = ${cLeft.toFixed(2)}`);

        // 右尾拒绝域
        const rightPoints: Array<{ x: number; y: number }> = [{ x: toX(cRight), y: y0 }];
        for (let x = cRight; x <= xMax; x += 0.02) {
          rightPoints.push({ x: toX(x), y: toY(getPdf(x)) });
        }
        rightPoints.push({ x: toX(xMax), y: y0 });
        fillHatchedRegion(rightPoints);
        drawCriticalLine(cRight, `c₂ = ${cRight.toFixed(2)}`);
      } else if (inputData.alternative === 'greater') {
        const cRight = getCrit(1 - alpha);
        const rightPoints: Array<{ x: number; y: number }> = [{ x: toX(cRight), y: y0 }];
        for (let x = cRight; x <= xMax; x += 0.02) {
          rightPoints.push({ x: toX(x), y: toY(getPdf(x)) });
        }
        rightPoints.push({ x: toX(xMax), y: y0 });
        fillHatchedRegion(rightPoints);
        drawCriticalLine(cRight, `c = ${cRight.toFixed(2)}`);
      } else {
        const cLeft = getCrit(alpha);
        const leftPoints: Array<{ x: number; y: number }> = [{ x: toX(xMin), y: y0 }];
        for (let x = xMin; x <= cLeft; x += 0.02) {
          leftPoints.push({ x: toX(x), y: toY(getPdf(x)) });
        }
        leftPoints.push({ x: toX(cLeft), y: y0 });
        fillHatchedRegion(leftPoints);
        drawCriticalLine(cLeft, `c = ${cLeft.toFixed(2)}`);
      }
    } else {
      // 卡方 χ² 与 F 检验均为右尾拒绝域
      const df1 = Math.max(1, currDf1);
      const df2 = Math.max(1, currDf2);
      const cRight = result.statisticName === 'χ²' ? chi2Inv(1 - alpha, df1) : fInv(1 - alpha, df1, df2);

      const rightPoints: Array<{ x: number; y: number }> = [{ x: toX(cRight), y: y0 }];
      for (let x = cRight; x <= xMax; x += 0.05) {
        rightPoints.push({ x: toX(x), y: toY(getPdf(x)) });
      }
      rightPoints.push({ x: toX(xMax), y: y0 });
      fillHatchedRegion(rightPoints);
      drawCriticalLine(cRight, `c = ${cRight.toFixed(2)}`);
    }

    // 3. 绘制概率密度主曲线 (Smooth Sage / Slate Line)
    ctx.strokeStyle = '#4A6B53';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    let first = true;
    const stepX = (xMax - xMin) / 200;
    for (let x = xMin; x <= xMax; x += stepX) {
      const px = toX(x);
      const py = toY(getPdf(x));
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // 4. 绘制样本检验统计量标记点 (Stat Pin - Terracotta or Deep Green)
    const statVal = currStat;
    if (statVal >= xMin && statVal <= xMax) {
      const pxStat = toX(statVal);
      const pyStat = toY(getPdf(statVal));

      const pinColor = result.rejectH0 ? '#8C4332' : '#3D523E';

      // 垂线
      ctx.strokeStyle = pinColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pxStat, y0);
      ctx.lineTo(pxStat, pyStat - 22);
      ctx.stroke();
      ctx.setLineDash([]);

      // 顶端点
      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(pxStat, pyStat, 5.5, 0, 2 * Math.PI);
      ctx.fill();

      // 文本标签
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const labelText = `${result.statisticName} = ${statVal.toFixed(2)}`;
      
      // 气泡卡片背景框
      const tw = ctx.measureText(labelText).width + 14;
      ctx.fillStyle = pinColor;
      ctx.roundRect(pxStat - tw / 2, pyStat - 36, tw, 22, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, pxStat, pyStat - 21);
    }

      if (progress < 1) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [inputData, result]);

  // 置信区间动态可视化 Canvas 渲染
  const ciCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ciAnimRef = useRef<{
    pointEst: number;
    nullVal: number;
    se: number;
    crit: number;
  } | null>(null);

  useEffect(() => {
    const canvas = ciCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetPointEst = 0;
    let targetNullVal = inputData.nullValue ?? 0;
    let targetSe = 1;
    let targetCrit = 1.96;
    let estimateName = '点估计值';

    if (inputData.testType === 't_one_sample') {
      targetPointEst = inputData.sampleMean ?? 102;
      targetNullVal = inputData.nullValue ?? 100;
      const n = inputData.sampleSize ?? 15;
      const sd = inputData.sampleSd ?? 12;
      targetSe = sd / Math.sqrt(n);
      const df = n - 1;
      targetCrit = tInv(1 - (1 - ciLevel) / 2, df);
      estimateName = 'x̄';
    } else if (inputData.testType === 'z_one_sample') {
      targetPointEst = inputData.sampleMean ?? 102;
      targetNullVal = inputData.nullValue ?? 100;
      const n = inputData.sampleSize ?? 15;
      const sd = inputData.sampleSd ?? 12;
      targetSe = sd / Math.sqrt(n);
      targetCrit = normalInv(1 - (1 - ciLevel) / 2);
      estimateName = 'x̄';
    } else if (inputData.testType === 't_two_sample_ind') {
      const m1 = inputData.group1Mean ?? 105;
      const m2 = inputData.group2Mean ?? 98;
      targetPointEst = m1 - m2;
      targetNullVal = 0;
      const n1 = inputData.group1Size ?? 20;
      const n2 = inputData.group2Size ?? 20;
      const s1 = inputData.group1Sd ?? 10;
      const s2 = inputData.group2Sd ?? 12;
      targetSe = Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2);
      const df = n1 + n2 - 2;
      targetCrit = tInv(1 - (1 - ciLevel) / 2, df);
      estimateName = 'x̄₁ - x̄₂';
    } else if (inputData.testType === 't_paired') {
      targetPointEst = inputData.sampleMean ?? 4.5;
      targetNullVal = 0;
      const n = inputData.sampleSize ?? 20;
      const sd = inputData.sampleSd ?? 6.2;
      targetSe = sd / Math.sqrt(n);
      const df = n - 1;
      targetCrit = tInv(1 - (1 - ciLevel) / 2, df);
      estimateName = 'd̄';
    } else if (inputData.testType === 'z_proportion_one') {
      const x1 = inputData.x1 ?? 60;
      const n1 = inputData.n1 ?? inputData.sampleSize ?? 100;
      const pHat = x1 / n1;
      const p0 = inputData.nullValue ?? 0.5;
      targetPointEst = pHat;
      targetNullVal = p0;
      targetSe = Math.sqrt((pHat * (1 - pHat)) / n1);
      targetCrit = normalInv(1 - (1 - ciLevel) / 2);
      estimateName = 'p̂';
    } else if (inputData.testType === 'z_proportion_two') {
      const x1 = inputData.x1 ?? 45;
      const n1 = inputData.n1 ?? 300;
      const x2 = inputData.x2 ?? 25;
      const n2 = inputData.n2 ?? 300;
      const p1 = x1 / n1;
      const p2 = x2 / n2;
      targetPointEst = p1 - p2;
      targetNullVal = 0;
      targetSe = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
      targetCrit = normalInv(1 - (1 - ciLevel) / 2);
      estimateName = 'p̂₁ - p̂₂';
    } else if (inputData.testType === 'f_two_variance') {
      const s1 = inputData.group1Sd ?? 5;
      const s2 = inputData.group2Sd ?? 3.16;
      targetPointEst = (s1 * s1) / (s2 * s2);
      targetNullVal = 1.0;
      const n1 = inputData.group1Size ?? 15;
      const n2 = inputData.group2Size ?? 15;
      targetSe = Math.sqrt(2 / (n1 - 1) + 2 / (n2 - 1));
      targetCrit = normalInv(1 - (1 - ciLevel) / 2);
      estimateName = 's₁² / s₂²';
    } else {
      targetPointEst = result.statisticValue;
      targetNullVal = 0;
      targetSe = 1.0;
      targetCrit = normalInv(1 - (1 - ciLevel) / 2);
      estimateName = `${result.statisticName}`;
    }

    if (!ciAnimRef.current) {
      ciAnimRef.current = { pointEst: targetPointEst, nullVal: targetNullVal, se: targetSe, crit: targetCrit };
    }

    const startPointEst = ciAnimRef.current.pointEst;
    const startNullVal = ciAnimRef.current.nullVal;
    const startSe = ciAnimRef.current.se;
    const startCrit = ciAnimRef.current.crit;

    const startTime = performance.now();
    const duration = 280; // 280ms 缓动动画
    let animId: number;

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      const pointEst = startPointEst + (targetPointEst - startPointEst) * ease;
      const nullVal = startNullVal + (targetNullVal - startNullVal) * ease;
      const se = startSe + (targetSe - startSe) * ease;
      const crit = startCrit + (targetCrit - startCrit) * ease;

      ciAnimRef.current = { pointEst, nullVal, se, crit };

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(0, 0, width, height);

      const paddingX = 65;
      const plotWidth = width - 2 * paddingX;
      const axisY = height / 2 + 8;

      const me = crit * se;
      const lcl = pointEst - me;
      const ucl = pointEst + me;
      const isNullInCI = nullVal >= lcl && nullVal <= ucl;

      const valSpan = Math.max(Math.abs(ucl - lcl) * 1.6, Math.abs(pointEst - nullVal) * 2.0, 0.4);
      const minX = Math.min(lcl, nullVal) - valSpan * 0.25;
      const maxX = Math.max(ucl, nullVal) + valSpan * 0.25;

      const toX = (v: number) => paddingX + ((v - minX) / (maxX - minX)) * plotWidth;

      // 1. Draw Axis Baseline
      ctx.strokeStyle = '#D6C7B2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(paddingX, axisY);
      ctx.lineTo(width - paddingX, axisY);
      ctx.stroke();

      // Ticks
      const numTicks = 5;
      ctx.fillStyle = '#8C8476';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i <= numTicks; i++) {
        const tv = minX + (i / numTicks) * (maxX - minX);
        const tx = toX(tv);
        ctx.beginPath();
        ctx.moveTo(tx, axisY);
        ctx.lineTo(tx, axisY + 4);
        ctx.stroke();
        ctx.fillText(tv.toFixed(2), tx, axisY + 16);
      }

      // 2. Null Value H0 Baseline
      const xNull = toX(nullVal);
      ctx.strokeStyle = '#8C8476';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xNull, 18);
      ctx.lineTo(xNull, axisY + 28);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#5A6354';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`H₀ = ${nullVal.toFixed(2)}`, xNull, 14);

      // 3. Draw Confidence Interval Bar [ LCL ──── • ──── UCL ]
      const xLcl = toX(lcl);
      const xUcl = toX(ucl);
      const xPoint = toX(pointEst);
      const mainColor = isNullInCI ? '#3D523E' : '#8C4332';
      const bgFillColor = isNullInCI ? 'rgba(61, 82, 62, 0.12)' : 'rgba(140, 67, 50, 0.12)';

      // Highlight area
      ctx.fillStyle = bgFillColor;
      ctx.fillRect(xLcl, axisY - 16, xUcl - xLcl, 32);

      // Bar line
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xLcl, axisY);
      ctx.lineTo(xUcl, axisY);
      ctx.stroke();

      // Brackets
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xLcl + 4, axisY - 10);
      ctx.lineTo(xLcl, axisY - 10);
      ctx.lineTo(xLcl, axisY + 10);
      ctx.lineTo(xLcl + 4, axisY + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xUcl - 4, axisY - 10);
      ctx.lineTo(xUcl, axisY - 10);
      ctx.lineTo(xUcl, axisY + 10);
      ctx.lineTo(xUcl - 4, axisY + 10);
      ctx.stroke();

      // 4. Point Estimate Dot
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.arc(xPoint, axisY, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text callouts
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = mainColor;
      ctx.textAlign = 'center';
      ctx.fillText(`${estimateName} = ${pointEst.toFixed(2)}`, xPoint, axisY - 22);

      ctx.font = 'bold 10px monospace';
      ctx.fillText(`LCL: ${lcl.toFixed(2)}`, xLcl, axisY + 28);
      ctx.fillText(`UCL: ${ucl.toFixed(2)}`, xUcl, axisY + 28);

      if (progress < 1) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [inputData, ciLevel, result]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-2">
        <div className="flex items-center space-x-2 text-[#7D8E7E]">
          <Play className="w-6 h-6" />
          <h2 className="text-xl font-bold text-[#5A6354]">
            假设检验 5 大标准步骤沙盒 (Dynamic 5-Step Sandbox)
          </h2>
        </div>
        <p className="text-xs text-[#7A7267]">
          以严密的 5 步假设检验推导逻辑为主线，将复杂的公式计算与分布决策过程拆解为直观易懂的闭环试验场。
        </p>
      </div>

      {/* 5 Steps Interactive Navigation Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {[
          { num: 1, title: '建立假设', desc: 'H₀ 与 H₁ 设置' },
          { num: 2, title: '选择统计量', desc: 'Z / t / χ² / F' },
          { num: 3, title: '显著性水平', desc: 'α 与单双侧' },
          { num: 4, title: '计算与 p 值', desc: '分布定位' },
          { num: 5, title: '决策与解读', desc: '拒绝域判定' },
        ].map((step) => {
          const isActive = activeStep === step.num;
          return (
            <button
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white shadow-xs font-bold'
                  : 'bg-white border-[#E5DFD3] hover:bg-[#F2EDE4] text-[#5A6354]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#E5DFD3] text-[#5A6354]'
                }`}>
                  {step.num}
                </span>
                <span className="text-xs font-bold">{step.title}</span>
              </div>
              <div className={`text-[10px] mt-1.5 ${isActive ? 'text-white/80' : 'text-[#8C8476]'}`}>
                {step.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Sandbox Layout: Controls vs Graphical Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Configuration Panels */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step 1 & 2 Config Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-4">
            <h3 className="text-sm font-bold text-[#5A6354] flex items-center space-x-2 border-b border-[#E5DFD3] pb-3">
              <Edit3 className="w-4 h-4 text-[#7D8E7E]" />
              <span>Step 1 - Step 3 参数配置</span>
            </h3>

            {/* Test Type Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5A6354]">选择假设检验类型</label>
              <select
                value={inputData.testType}
                onChange={(e) => setInputData({ ...inputData, testType: e.target.value as SpecificTestType })}
                className="w-full text-xs bg-[#F9F7F2] border border-[#E5DFD3] rounded-xl px-3 py-2 text-[#3D3D3D] font-medium focus:outline-hidden"
              >
                <option value="t_one_sample">单样本 t 检验 (One-Sample t-Test)</option>
                <option value="t_two_sample_ind">独立双样本 t 检验 (Independent t-Test)</option>
                <option value="t_paired">配对样本 t 检验 (Paired t-Test)</option>
                <option value="z_one_sample">单样本 Z 检验 (One-Sample Z-Test)</option>
                <option value="z_proportion_one">单样本比例 Z 检验 (One-Proportion Z-Test)</option>
                <option value="z_proportion_two">双样本比例之差 Z 检验 (Two-Proportion Z-Test)</option>
                <option value="chi2_independence">卡方独立性检验 (Chi-Square Test)</option>
                <option value="f_two_variance">双样本方差比 F 检验 (F-Test)</option>
              </select>
            </div>

            {/* Alternative Hypothesis Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5A6354]">备择假设 H₁ 方向</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: 'two_sided', label: '双侧 (≠)' },
                  { id: 'greater', label: '右单侧 (>)' },
                  { id: 'less', label: '左单侧 (<)' },
                ].map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => setInputData({ ...inputData, alternative: alt.id as AlternativeHypothesis })}
                    className={`py-2 rounded-xl text-center border font-medium transition-all cursor-pointer ${
                      inputData.alternative === alt.id
                        ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                        : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                    }`}
                  >
                    {alt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Significance Level Alpha */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#5A6354]">
                <StatTerm term="显著性水平 α" context={{ testType: inputData.testType, alpha: inputData.alpha }}>显著性水平 α (Significance Level)</StatTerm>
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[0.10, 0.05, 0.01].map((a) => (
                  <button
                    key={a}
                    onClick={() => setInputData({ ...inputData, alpha: a })}
                    className={`py-2 rounded-xl text-center border font-medium transition-all cursor-pointer ${
                      inputData.alpha === a
                        ? 'bg-[#7D8E7E] border-[#7D8E7E] text-white font-bold'
                        : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                    }`}
                  >
                    α = {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Sample Inputs (Conditional) */}
            <div className="pt-3 border-t border-[#E5DFD3] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#5A6354] uppercase tracking-wide">样本参数与样本量 (n) 配置</h4>
                <span className="text-[10px] text-[#8C8476] bg-[#F2EDE4] px-2 py-0.5 rounded-full font-mono">实时影响 SE 与 df</span>
              </div>

              {(inputData.testType === 't_one_sample' || inputData.testType === 'z_one_sample') && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[#8C8476] block mb-1 font-medium">原假设均值 μ₀</label>
                      <input
                        type="number"
                        value={inputData.nullValue}
                        onChange={(e) => setInputData({ ...inputData, nullValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#F9F7F2] border border-[#E5DFD3] rounded-xl p-2 font-mono text-[#3D3D3D] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[#8C8476] block mb-1 font-medium">样本均值 x̄</label>
                      <input
                        type="number"
                        value={inputData.sampleMean ?? 102}
                        onChange={(e) => setInputData({ ...inputData, sampleMean: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#F9F7F2] border border-[#E5DFD3] rounded-xl p-2 font-mono text-[#3D3D3D] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[#8C8476] block mb-1 font-medium">
                        {inputData.testType === 'z_one_sample' ? '总体标准差 σ' : '样本标准差 s'}
                      </label>
                      <input
                        type="number"
                        value={inputData.sampleSd ?? 12}
                        onChange={(e) => setInputData({ ...inputData, sampleSd: Math.max(0.01, parseFloat(e.target.value) || 1) })}
                        className="w-full bg-[#F9F7F2] border border-[#E5DFD3] rounded-xl p-2 font-mono text-[#3D3D3D] focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[#5A6354] block mb-1 font-bold flex items-center justify-between">
                        <span>样本量 n</span>
                        <span className="text-[10px] text-[#7D8E7E] font-mono">df = {(inputData.sampleSize ?? 15) - 1}</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="1000"
                        value={inputData.sampleSize ?? 15}
                        onChange={(e) => setInputData({ ...inputData, sampleSize: Math.max(2, parseInt(e.target.value) || 2) })}
                        className="w-full bg-[#F9F7F2] border border-[#7D8E7E] rounded-xl p-2 font-mono font-bold text-[#2D2A26] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* 样本量 n 快捷选择器 */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">快捷配置样本量 n：</span>
                    <div className="flex items-center gap-1.5">
                      {[5, 15, 30, 60, 200].map((quickN) => (
                        <button
                          key={quickN}
                          type="button"
                          onClick={() => setInputData({ ...inputData, sampleSize: quickN })}
                          className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                            (inputData.sampleSize ?? 15) === quickN
                              ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold'
                              : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                          }`}
                        >
                          n={quickN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inputData.testType === 't_two_sample_ind' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A6354]">组 1 (实验组)</span>
                      <span className="text-[10px] font-mono text-[#8C8476]">n₁ = {inputData.group1Size ?? 20}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1 text-[11px]">均值 x̄₁</label>
                        <input
                          type="number"
                          value={inputData.group1Mean ?? 105}
                          onChange={(e) => setInputData({ ...inputData, group1Mean: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#8C8476] block mb-1 text-[11px]">标准差 s₁</label>
                        <input
                          type="number"
                          value={inputData.group1Sd ?? 10}
                          onChange={(e) => setInputData({ ...inputData, group1Sd: Math.max(0.01, parseFloat(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5A6354] block mb-1 text-[11px] font-bold">样本量 n₁</label>
                        <input
                          type="number"
                          min="2"
                          value={inputData.group1Size ?? 20}
                          onChange={(e) => setInputData({ ...inputData, group1Size: Math.max(2, parseInt(e.target.value) || 2) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A6354]">组 2 (对照组)</span>
                      <span className="text-[10px] font-mono text-[#8C8476]">n₂ = {inputData.group2Size ?? 20}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1 text-[11px]">均值 x̄₂</label>
                        <input
                          type="number"
                          value={inputData.group2Mean ?? 98}
                          onChange={(e) => setInputData({ ...inputData, group2Mean: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#8C8476] block mb-1 text-[11px]">标准差 s₂</label>
                        <input
                          type="number"
                          value={inputData.group2Sd ?? 12}
                          onChange={(e) => setInputData({ ...inputData, group2Sd: Math.max(0.01, parseFloat(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5A6354] block mb-1 text-[11px] font-bold">样本量 n₂</label>
                        <input
                          type="number"
                          min="2"
                          value={inputData.group2Size ?? 20}
                          onChange={(e) => setInputData({ ...inputData, group2Size: Math.max(2, parseInt(e.target.value) || 2) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 双样本快捷样本量联动配置 */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">双组同步设量：</span>
                    <div className="flex items-center gap-1.5">
                      {[10, 20, 50, 100].map((quickN) => (
                        <button
                          key={quickN}
                          type="button"
                          onClick={() => setInputData({ ...inputData, group1Size: quickN, group2Size: quickN })}
                          className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                            (inputData.group1Size ?? 20) === quickN && (inputData.group2Size ?? 20) === quickN
                              ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold'
                              : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                          }`}
                        >
                          n₁=n₂={quickN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inputData.testType === 'z_proportion_one' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1 font-medium">原假设目标比例 p₀</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="0.99"
                          value={inputData.nullValue ?? 0.5}
                          onChange={(e) => setInputData({ ...inputData, nullValue: parseFloat(e.target.value) || 0.5 })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#8C8476] block mb-1 font-medium">观测成功/转化数 x</label>
                        <input
                          type="number"
                          min="0"
                          value={inputData.x1 ?? 60}
                          onChange={(e) => setInputData({ ...inputData, x1: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[#5A6354] block mb-1 font-bold flex items-center justify-between">
                          <span>样本量 n</span>
                          <span className="text-[10px] text-[#7D8E7E] font-mono">
                            p̂ = {(((inputData.x1 ?? 60) / (inputData.n1 ?? 100)) * 100).toFixed(1)}%
                          </span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={inputData.n1 ?? 100}
                          onChange={(e) => setInputData({ ...inputData, n1: Math.max(1, parseInt(e.target.value) || 1), sampleSize: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 快捷放缩样本规模 n */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">快捷调控样本规模 n：</span>
                    <div className="flex items-center gap-1.5">
                      {[50, 100, 300, 1000].map((quickN) => (
                        <button
                          key={quickN}
                          type="button"
                          onClick={() => setInputData({ ...inputData, n1: quickN, sampleSize: quickN })}
                          className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                            (inputData.n1 ?? 100) === quickN
                              ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold'
                              : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                          }`}
                        >
                          n={quickN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inputData.testType === 'z_proportion_two' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1">组 1 转化数 x₁</label>
                        <input
                          type="number"
                          value={inputData.x1 ?? 45}
                          onChange={(e) => setInputData({ ...inputData, x1: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5A6354] block mb-1 font-bold">组 1 样本量 n₁</label>
                        <input
                          type="number"
                          min="1"
                          value={inputData.n1 ?? 300}
                          onChange={(e) => setInputData({ ...inputData, n1: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1">组 2 转化数 x₂</label>
                        <input
                          type="number"
                          value={inputData.x2 ?? 25}
                          onChange={(e) => setInputData({ ...inputData, x2: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5A6354] block mb-1 font-bold">组 2 样本量 n₂</label>
                        <input
                          type="number"
                          min="1"
                          value={inputData.n2 ?? 300}
                          onChange={(e) => setInputData({ ...inputData, n2: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 比例检验快捷样本量调节 */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">快捷调控样本规模 n：</span>
                    <div className="flex items-center gap-1.5">
                      {[100, 300, 1000, 5000].map((quickN) => (
                        <button
                          key={quickN}
                          type="button"
                          onClick={() => setInputData({ ...inputData, n1: quickN, n2: quickN })}
                          className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                            (inputData.n1 ?? 300) === quickN && (inputData.n2 ?? 300) === quickN
                              ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold'
                              : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                          }`}
                        >
                          n₁=n₂={quickN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inputData.testType === 't_paired' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1">平均差值 d̄ (x̄₁ - x̄₂)</label>
                        <input
                          type="number"
                          value={inputData.sampleMean ?? 4.5}
                          onChange={(e) => setInputData({ ...inputData, sampleMean: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#8C8476] block mb-1">差值标准差 s_d</label>
                        <input
                          type="number"
                          value={inputData.sampleSd ?? 6.2}
                          onChange={(e) => setInputData({ ...inputData, sampleSd: Math.max(0.01, parseFloat(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[#5A6354] block mb-1 font-bold">配对样本量 n</label>
                        <input
                          type="number"
                          min="2"
                          value={inputData.sampleSize ?? 20}
                          onChange={(e) => setInputData({ ...inputData, sampleSize: Math.max(2, parseInt(e.target.value) || 2) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-1">
                        <span className="text-[10px] text-[#8C8476] font-mono">自由度 df = {(inputData.sampleSize ?? 20) - 1}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">快捷选择配对样本量 n：</span>
                    <div className="flex items-center gap-1.5">
                      {[10, 20, 50, 100].map((quickN) => (
                        <button
                          key={quickN}
                          type="button"
                          onClick={() => setInputData({ ...inputData, sampleSize: quickN })}
                          className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                            (inputData.sampleSize ?? 20) === quickN
                              ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold'
                              : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                          }`}
                        >
                          n={quickN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inputData.testType === 'f_two_variance' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A6354]">组 1 方差参数</span>
                      <span className="text-[10px] font-mono text-[#8C8476]">df₁ = {(inputData.group1Size ?? 15) - 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1">标准差 s₁ (或方差 s₁²)</label>
                        <input
                          type="number"
                          value={inputData.group1Sd ?? 5}
                          onChange={(e) => setInputData({ ...inputData, group1Sd: Math.max(0.01, parseFloat(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5A6354] block mb-1 font-bold">样本量 n₁</label>
                        <input
                          type="number"
                          min="2"
                          value={inputData.group1Size ?? 15}
                          onChange={(e) => setInputData({ ...inputData, group1Size: Math.max(2, parseInt(e.target.value) || 2) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A6354]">组 2 方差参数</span>
                      <span className="text-[10px] font-mono text-[#8C8476]">df₂ = {(inputData.group2Size ?? 15) - 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#8C8476] block mb-1">标准差 s₂ (或方差 s₂²)</label>
                        <input
                          type="number"
                          value={inputData.group2Sd ?? 3.16}
                          onChange={(e) => setInputData({ ...inputData, group2Sd: Math.max(0.01, parseFloat(e.target.value) || 1) })}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5A6354] block mb-1 font-bold">样本量 n₂</label>
                        <input
                          type="number"
                          min="2"
                          value={inputData.group2Size ?? 15}
                          onChange={(e) => setInputData({ ...inputData, group2Size: Math.max(2, parseInt(e.target.value) || 2) })}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">双组同步配置样本量：</span>
                    <div className="flex items-center gap-1.5">
                      {[10, 20, 50, 100].map((quickN) => (
                        <button
                          key={quickN}
                          type="button"
                          onClick={() => setInputData({ ...inputData, group1Size: quickN, group2Size: quickN })}
                          className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                            (inputData.group1Size ?? 15) === quickN && (inputData.group2Size ?? 15) === quickN
                              ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold'
                              : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                          }`}
                        >
                          n₁=n₂={quickN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inputData.testType === 'f_anova_one_way' && (
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A6354]">单因素 ANOVA 样本设置</span>
                      <span className="text-[10px] font-mono text-[#8C8476]">
                        k={inputData.anovaGroupsData?.length ?? 3}, N={(inputData.anovaGroupsData?.length ?? 3) * (inputData.sampleSize ?? 10)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#5A6354] block mb-1 font-bold">每组样本量 n_g</label>
                        <input
                          type="number"
                          min="3"
                          max="200"
                          value={inputData.sampleSize ?? 10}
                          onChange={(e) => {
                            const newN = Math.max(3, parseInt(e.target.value) || 3);
                            const currentGroups = inputData.anovaGroupsData || [
                              { name: '组 A', values: [85, 88, 90, 82, 86] },
                              { name: '组 B', values: [92, 95, 89, 94, 96] },
                              { name: '组 C', values: [78, 80, 84, 82, 79] }
                            ];
                            const updatedGroups = currentGroups.map((g, idx) => {
                              const baseMean = idx === 0 ? 86 : idx === 1 ? 93 : 81;
                              const vals = Array.from({ length: newN }, (_, i) => Math.round(baseMean + Math.sin(i * 1.5) * 4));
                              return { ...g, values: vals };
                            });
                            setInputData({ ...inputData, sampleSize: newN, anovaGroupsData: updatedGroups });
                          }}
                          className="w-full bg-white border border-[#7D8E7E] rounded-lg p-1.5 font-mono text-[#2D2A26] font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[#8C8476] block mb-1">组数 k</label>
                        <select
                          value={inputData.anovaGroupsData?.length ?? 3}
                          onChange={(e) => {
                            const numK = parseInt(e.target.value) || 3;
                            const currentN = inputData.sampleSize ?? 10;
                            const groupNames = ['组 A', '组 B', '组 C', '组 D', '组 E'];
                            const baseMeans = [86, 93, 81, 88, 90];
                            const newGroups = Array.from({ length: numK }, (_, idx) => {
                              const baseMean = baseMeans[idx % baseMeans.length];
                              const vals = Array.from({ length: currentN }, (_, i) => Math.round(baseMean + Math.sin(i * 1.5) * 4));
                              return { name: groupNames[idx], values: vals };
                            });
                            setInputData({ ...inputData, anovaGroupsData: newGroups });
                          }}
                          className="w-full bg-white border border-[#E5DFD3] rounded-lg p-1.5 font-mono text-[#3D3D3D]"
                        >
                          <option value="3">3 组 (df_between = 2)</option>
                          <option value="4">4 组 (df_between = 3)</option>
                          <option value="5">5 组 (df_between = 4)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">快捷配置每组样本量 n_g：</span>
                    <div className="flex items-center gap-1.5">
                      {[5, 15, 30, 60, 100].map((quickN) => (
                        <button
                          key={quickN}
                          type="button"
                          onClick={() => {
                            const currentGroups = inputData.anovaGroupsData || [
                              { name: '组 A', values: [85, 88, 90, 82, 86] },
                              { name: '组 B', values: [92, 95, 89, 94, 96] },
                              { name: '组 C', values: [78, 80, 84, 82, 79] }
                            ];
                            const updatedGroups = currentGroups.map((g, idx) => {
                              const baseMean = idx === 0 ? 86 : idx === 1 ? 93 : 81;
                              const vals = Array.from({ length: quickN }, (_, i) => Math.round(baseMean + Math.sin(i * 1.5) * 4));
                              return { ...g, values: vals };
                            });
                            setInputData({ ...inputData, sampleSize: quickN, anovaGroupsData: updatedGroups });
                          }}
                          className={`px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${
                            (inputData.sampleSize ?? 10) === quickN
                              ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold'
                              : 'bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white'
                          }`}
                        >
                          n_g={quickN}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inputData.testType === 'chi2_independence' && (
                <div className="space-y-3 text-xs">
                  {/* 列联表维度与自由度设置 */}
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A6354]">1. 选择列联表维度 (r × c)</span>
                      <span className="text-[10px] font-mono text-[#3D523E] font-bold bg-[#E5ECE3] px-2 py-0.5 rounded-md">
                        df = (r-1)×(c-1) = {((inputData.contingencyTable || [[35, 15], [20, 30]]).length - 1) * ((inputData.contingencyTable || [[35, 15], [20, 30]])[0].length - 1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      {[
                        { label: '2 × 2 (df = 1)', r: 2, c: 2, defaultTable: [[35, 15], [20, 30]] },
                        { label: '2 × 3 (df = 2)', r: 2, c: 3, defaultTable: [[30, 20, 10], [15, 25, 20]] },
                        { label: '3 × 3 (df = 4)', r: 3, c: 3, defaultTable: [[25, 15, 10], [15, 20, 15], [10, 15, 25]] }
                      ].map((dim) => {
                        const currentTable = inputData.contingencyTable || [[35, 15], [20, 30]];
                        const isActive = currentTable.length === dim.r && currentTable[0].length === dim.c;
                        return (
                          <button
                            key={dim.label}
                            type="button"
                            onClick={() => setInputData({ ...inputData, contingencyTable: dim.defaultTable })}
                            className={`px-2.5 py-1 text-[11px] font-mono rounded-xl border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#3D523E] border-[#3D523E] text-white font-bold shadow-2xs'
                                : 'bg-white border-[#E5DFD3] text-[#5A6354] hover:bg-[#F2EDE4]'
                            }`}
                          >
                            {dim.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 观测频数交互网格矩阵 */}
                  <div className="p-2.5 bg-[#F9F7F2] rounded-2xl border border-[#E5DFD3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5A6354]">2. 编辑单元格观测频数 O_ij</span>
                      <span className="text-[10px] font-mono text-[#8C8476]">
                        总样本 N = {(inputData.contingencyTable || [[35, 15], [20, 30]]).flatMap(r => r).reduce((a, b) => a + b, 0)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-[#E5DFD3] text-[#8C8476]">
                            <th className="p-1 text-left font-normal">类别</th>
                            {(inputData.contingencyTable || [[35, 15], [20, 30]])[0].map((_, colIdx) => (
                              <th key={colIdx} className="p-1 font-mono">列 C{colIdx + 1}</th>
                            ))}
                            <th className="p-1 font-mono text-[#5A6354]">行和</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(inputData.contingencyTable || [[35, 15], [20, 30]]).map((row, rowIdx) => {
                            const rowSum = row.reduce((a, b) => a + b, 0);
                            return (
                              <tr key={rowIdx} className="border-b border-[#E5DFD3]/60">
                                <td className="p-1 text-left font-bold text-[#5A6354]">行 R{rowIdx + 1}</td>
                                {row.map((val, colIdx) => (
                                  <td key={colIdx} className="p-1">
                                    <input
                                      type="number"
                                      min="0"
                                      value={val}
                                      onChange={(e) => {
                                        const newVal = Math.max(0, parseInt(e.target.value) || 0);
                                        const currentTable = inputData.contingencyTable
                                          ? inputData.contingencyTable.map(r => [...r])
                                          : [[35, 15], [20, 30]];
                                        currentTable[rowIdx][colIdx] = newVal;
                                        setInputData({ ...inputData, contingencyTable: currentTable });
                                      }}
                                      className="w-14 bg-white border border-[#E5DFD3] rounded-lg p-1 text-center font-mono text-[#3D3D3D] focus:border-[#3D523E] focus:outline-none"
                                    />
                                  </td>
                                ))}
                                <td className="p-1 font-mono font-bold text-[#5A6354]">{rowSum}</td>
                              </tr>
                            );
                          })}
                          <tr className="font-bold text-[#3D523E] bg-[#E8E2D7]/40">
                            <td className="p-1 text-left">列和</td>
                            {(inputData.contingencyTable || [[35, 15], [20, 30]])[0].map((_, colIdx) => {
                              const table = inputData.contingencyTable || [[35, 15], [20, 30]];
                              const colSum = table.reduce((sum, r) => sum + (r[colIdx] || 0), 0);
                              return (
                                <td key={colIdx} className="p-1 font-mono">{colSum}</td>
                              );
                            })}
                            <td className="p-1 font-mono text-[#C0563E]">
                              {(inputData.contingencyTable || [[35, 15], [20, 30]]).flatMap(r => r).reduce((a, b) => a + b, 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 快捷放缩总样本量 N */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C8476] font-medium">3. 快捷按比例放缩总样本规模 N：</span>
                    <div className="flex items-center gap-1.5">
                      {[50, 100, 200, 500, 1000].map((targetN) => {
                        const table = inputData.contingencyTable || [[35, 15], [20, 30]];
                        const currentTotal = table.flatMap(r => r).reduce((a, b) => a + b, 0) || 1;
                        const factor = targetN / currentTotal;
                        return (
                          <button
                            key={targetN}
                            type="button"
                            onClick={() => {
                              const scaledTable = table.map(row =>
                                row.map(cell => Math.max(1, Math.round(cell * factor)))
                              );
                              setInputData({ ...inputData, contingencyTable: scaledTable });
                            }}
                            className="px-2 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer bg-[#F2EDE4] border-[#E5DFD3] text-[#5A6354] hover:bg-white"
                          >
                            N ≈ {targetN}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Graphical Canvas & Decision Output */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 4: Graphical Canvas Curve Plot */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5DFD3] pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-[#7D8E7E]" />
                <h3 className="text-sm font-bold text-[#5A6354]">
                  Step 4. 统计量与 p 值分布定位曲线
                </h3>
              </div>

              <div className="text-xs font-mono font-bold text-[#5A6354] bg-[#F2EDE4] px-2.5 py-1 rounded-lg border border-[#E5DFD3]">
                <StatTerm term="自由度" context={{ testType: inputData.testType, df: result.df }}>
                  自由度 df: {typeof result.df === 'number' ? result.df : result.df.join(', ')}
                </StatTerm>
              </div>
            </div>

            {/* 样本量 n 影响传导与数学推导联动提示 */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D7] text-xs text-[#5A6354] space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1.5 text-[#3D523E]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C0563E]" />
                  <span>样本量 (n) 传导机制与 Step 4 匹配</span>
                </span>
                <span className="font-mono text-[11px] text-[#8C8476]">
                  {result.statisticName} = {result.statisticValue.toFixed(3)}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7267] leading-relaxed">
                {inputData.testType === 't_one_sample' && (
                  <>
                    当样本量 <strong className="text-[#2D2A26]">n = {inputData.sampleSize ?? 15}</strong> 时，估计标准误 <span className="font-serif italic font-semibold">SE = s / √n = {((inputData.sampleSd ?? 12) / Math.sqrt(inputData.sampleSize ?? 15)).toFixed(3)}</span>。增大 n 可缩小 SE，使统计量 t 扩大并推向分布尾部；同时自由度 <span className="font-mono">df = { (inputData.sampleSize ?? 15) - 1 }</span> 越大，t 分布尾部越薄并快速收敛于正态分布。
                  </>
                )}
                {inputData.testType === 'z_one_sample' && (
                  <>
                    在已知总体 σ 下，样本量 <strong className="text-[#2D2A26]">n = {inputData.sampleSize ?? 15}</strong> 直接决定分子浮动的缩放系数 <span className="font-serif italic font-semibold">SE = σ / √n = {((inputData.sampleSd ?? 12) / Math.sqrt(inputData.sampleSize ?? 15)).toFixed(3)}</span>。
                  </>
                )}
                {inputData.testType === 't_two_sample_ind' && (
                  <>
                    样本量 <strong className="text-[#2D2A26]">n₁ = {inputData.group1Size ?? 20}, n₂ = {inputData.group2Size ?? 20}</strong>，合算自由度 <span className="font-mono">df = n₁ + n₂ - 2 = {(inputData.group1Size ?? 20) + (inputData.group2Size ?? 20) - 2}</span>。提高样本量能有效提升检验敏锐度，减小混合标准误。
                  </>
                )}
                {inputData.testType === 'z_proportion_one' && (
                  <>
                    样本量 <strong className="text-[#2D2A26]">n = {inputData.n1 ?? inputData.sampleSize ?? 100}</strong>，标准误 <span className="font-serif italic font-semibold">SE₀ = √(p₀(1-p₀)/n) = {Math.sqrt(((inputData.nullValue ?? 0.5) * (1 - (inputData.nullValue ?? 0.5))) / (inputData.n1 ?? inputData.sampleSize ?? 100)).toFixed(3)}</span>。增大 n 可显著缩小标准误，提高估计敏感度。
                  </>
                )}
                {inputData.testType === 'z_proportion_two' && (
                  <>
                    样本量 <strong className="text-[#2D2A26]">n₁ = {inputData.n1 ?? 300}, n₂ = {inputData.n2 ?? 300}</strong>，总体标准误跟随样本规模成 <span className="font-serif italic">1/√n</span> 级别下降。
                  </>
                )}
                {inputData.testType === 't_paired' && (
                  <>
                    配对样本量 <strong className="text-[#2D2A26]">n = {inputData.sampleSize ?? 20}</strong> 时，配对差值标准误 <span className="font-serif italic font-semibold">SE = s_d / √n = {((inputData.sampleSd ?? 6.2) / Math.sqrt(inputData.sampleSize ?? 20)).toFixed(3)}</span>，自由度 <span className="font-mono">df = n - 1 = {(inputData.sampleSize ?? 20) - 1}</span>。
                  </>
                )}
                {inputData.testType === 'f_two_variance' && (
                  <>
                    两组样本量 <strong className="text-[#2D2A26]">n₁ = {inputData.group1Size ?? 15}, n₂ = {inputData.group2Size ?? 15}</strong> 分别决定 F 检验分子分母自由度 <span className="font-mono">df₁ = {(inputData.group1Size ?? 15) - 1}, df₂ = {(inputData.group2Size ?? 15) - 1}</span>。
                  </>
                )}
                {inputData.testType === 'f_anova_one_way' && (
                  <>
                    组别数 <strong className="text-[#2D2A26]">k = {inputData.anovaGroupsData?.length ?? 3}</strong>，每组样本量 <strong className="text-[#2D2A26]">n_g = {inputData.sampleSize ?? 10}</strong>（总样本 <span className="font-mono">N = {(inputData.anovaGroupsData?.length ?? 3) * (inputData.sampleSize ?? 10)}</span>），组间与组内自由度分别为 <span className="font-mono">df_b = {(inputData.anovaGroupsData?.length ?? 3) - 1}, df_w = {(inputData.anovaGroupsData?.length ?? 3) * (inputData.sampleSize ?? 10) - (inputData.anovaGroupsData?.length ?? 3)}</span>。
                  </>
                )}
                {inputData.testType === 'chi2_independence' && (
                  <>
                    当前为 <strong className="text-[#2D2A26] font-mono">{(inputData.contingencyTable || [[35, 15], [20, 30]]).length} × {(inputData.contingencyTable || [[35, 15], [20, 30]])[0].length}</strong> 列联表，自由度法则为 <span className="font-mono font-bold text-[#3D523E]">df = (r - 1) × (c - 1) = {((inputData.contingencyTable || [[35, 15], [20, 30]]).length - 1) * ((inputData.contingencyTable || [[35, 15], [20, 30]])[0].length - 1)}</span>。总观测样本规模 <strong className="text-[#2D2A26]">N = {(inputData.contingencyTable || [[35, 15], [20, 30]]).flatMap(r => r).reduce((a, b) => a + b, 0)}</strong>，增加 N 会等比例提升期望频数，使相同比例偏离产生更大的 χ² 检验统计量。
                  </>
                )}
              </p>
            </div>

            {/* 淡雅温润的画布与图例区域 */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 flex flex-col items-center border border-[#E5DFD3] shadow-inner space-y-3">
              <canvas
                ref={canvasRef}
                width={600}
                height={280}
                className="w-full max-w-[600px] h-auto rounded-xl border border-[#E8E2D7] shadow-2xs"
              />

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#5A6354]">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-3.5 bg-[#E8C8BE]/70 border border-[#C0563E] rounded-xs inline-block relative overflow-hidden shadow-2xs">
                    <span className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,#C0563E_25%,#C0563E_50%,transparent_50%,transparent_75%,#C0563E_75%)] bg-[length:4px_4px] opacity-40" />
                  </span>
                  <span className="font-medium text-[#7A7267]">拒绝域 (α = {result.alpha})</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`w-3.5 h-3.5 rounded-full inline-block border-2 border-white shadow-xs ${result.rejectH0 ? 'bg-[#8C4332]' : 'bg-[#3D523E]'}`} />
                  <span className="font-bold text-[#2D2A26]">
                    统计量 {result.statisticName} = {result.statisticValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 点估计值的置信区间 (Confidence Interval) 可视化模块 */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E5DFD3] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5DFD3] pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#3D523E]" />
                <h3 className="text-sm font-bold text-[#5A6354]">
                  点估计值与置信区间 (Confidence Interval) 动态演化
                </h3>
              </div>

              {/* 置信水平 (90%, 95%, 99%) 动态选择器 */}
              <div className="flex items-center space-x-1.5 bg-[#F2EDE4] p-1 rounded-xl border border-[#E5DFD3]">
                <span className="text-[11px] text-[#8C8476] font-medium px-2">置信水平 1-α:</span>
                {[0.90, 0.95, 0.99].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCiLevel(lvl)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                      ciLevel === lvl
                        ? 'bg-[#3D523E] text-white font-bold shadow-2xs'
                        : 'text-[#5A6354] hover:bg-white'
                    }`}
                  >
                    {Math.round(lvl * 100)}%
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-[#7A7267] leading-relaxed">
              置信区间表达了以点估计值为中心、在指定置信水平 (1 - α) 下包含总体真实参数的可能范围。
              调整样本量 <span className="font-mono font-bold text-[#3D523E]">n</span> 或置信水平可直观观察 <strong className="text-[#2D2A26]">区间宽度 [LCL, UCL]</strong> 的收缩与扩张：
            </p>

            {/* 置信区间绘图 Canvas */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 flex flex-col items-center border border-[#E5DFD3] shadow-inner space-y-3">
              <canvas
                ref={ciCanvasRef}
                width={600}
                height={150}
                className="w-full max-w-[600px] h-auto rounded-xl border border-[#E8E2D7] shadow-2xs"
              />

              <div className="flex flex-wrap items-center justify-between w-full max-w-[600px] px-2 text-xs text-[#5A6354] bg-white p-2.5 rounded-xl border border-[#E5DFD3]">
                <div>
                  <span className="text-[#8C8476] mr-1">对应临界值:</span>
                  <span className="font-mono font-bold text-[#3D523E]">
                    {ciLevel === 0.90 ? 'z_{0.05}=1.645' : ciLevel === 0.95 ? 'z_{0.025}=1.960' : 'z_{0.005}=2.576'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C8476] mr-1">与 H₀ 基准线关系:</span>
                  <span className={`font-bold ${result.rejectH0 ? 'text-[#8C4332]' : 'text-[#3D523E]'}`}>
                    {result.rejectH0 ? '区间未包含 H₀ (拒绝 H₀)' : '区间覆盖 H₀ (包含零假设值)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: Final Decision Card */}
          <div className={`rounded-3xl p-6 border shadow-xs space-y-4 transition-all ${
            result.rejectH0
              ? 'bg-[#FDF6F0] border-[#E8C8BE]'
              : 'bg-[#F4F7F4] border-[#C8D6C9]'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {result.rejectH0 ? (
                  <div className="w-10 h-10 rounded-2xl bg-[#E8C8BE]/50 text-[#8C4332] flex items-center justify-center font-bold">
                    <XCircle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-[#C8D6C9]/50 text-[#3D523E] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8C8476]">
                    Step 5 统计学决策结论
                  </div>
                  <h3 className={`text-lg font-extrabold ${result.rejectH0 ? 'text-[#8C4332]' : 'text-[#3D523E]'}`}>
                    {result.rejectH0 ? '拒绝原假设 H₀ (Reject H₀)' : '无法拒绝原假设 H₀ (Fail to Reject H₀)'}
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#8C8476]">
                  计算得到的 <StatTerm term="p 值" context={{ testType: inputData.testType, pValue: result.pValue, alpha: inputData.alpha }}>p 值</StatTerm>
                </div>
                <div className="text-xl font-mono font-extrabold text-[#3D3D3D]">
                  p = {result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(4)}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#3D3D3D] leading-relaxed font-medium">
              {result.interpretation}
            </p>

            {/* APA Standard Output Box */}
            <div className="p-3 bg-white/90 rounded-2xl border border-[#E5DFD3] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-[#8C8476]">学术论文 APA 格式引用</div>
                <div className="text-xs font-mono font-bold text-[#3D3D3D]">{result.apaFormat}</div>
              </div>
              <button
                onClick={handleCopyAPA}
                className="px-3 py-1.5 text-xs font-medium text-[#5A6354] bg-[#F2EDE4] hover:bg-[#E5DFD3] rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#7D8E7E]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制 APA'}</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
              <button
                onClick={() => onNavigate('distribution')}
                className="text-[#7D8E7E] hover:text-[#5A6354] font-bold flex items-center space-x-1 cursor-pointer"
              >
                <span>进入“分布与两类错误博弈”分析第一类/第二类错误风险</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('ai')}
                  className="px-3.5 py-2 bg-[#7D8E7E] text-white font-semibold rounded-xl hover:bg-[#6C7D6D] transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>生成 AI 洞察</span>
                </button>
                <button
                  onClick={() => onNavigate('report')}
                  className="px-3.5 py-2 bg-[#2D2A26] text-white font-semibold rounded-xl hover:bg-[#3D3D3D] transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>导出报告</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
