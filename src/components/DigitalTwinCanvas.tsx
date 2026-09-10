import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Snowflake,
  Flame,
  Wind,
  Layers,
  Thermometer,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import { SimulationInput, SimulationOutput } from '../types';
import { draw316MarinePropeller } from '../utils/propellerRenderer';

interface DigitalTwinCanvasProps {
  input: SimulationInput;
  output: SimulationOutput | null;
  isSimulating: boolean;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  input,
  output,
  isSimulating,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<'vessel' | 'microstructure' | 'streamlines'>('vessel');

  const {
    raw_material,
    equipment_type,
    rpm,
    cooling_jacket,
    attachment_type,
    has_baffles,
  } = input;

  const currentTemp = output ? output.final_temperature_celsius : input.initial_temp_celsius || 15;
  const isDenatured = output?.extra_metrics?.protein_denaturation_pct ? output.extra_metrics.protein_denaturation_pct > 20 : false;
  const isOxidized = output?.extra_metrics?.oxidation_risk === '極高 (Critical)';

  useEffect(() => {
    let animationFrameId: number;
    let rotationAngle = 0;
    let coolantPhase = 0;
    let particlePhase = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const updateSize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Color palette based on material
    const getMaterialColor = () => {
      const lower = raw_material.toLowerCase();
      if (lower.includes('貢丸') || lower.includes('肉') || lower.includes('魚漿')) {
        return isDenatured ? '#9c7a72' : '#e06d75'; // grayish brown if denatured, fresh pink if healthy
      }
      if (lower.includes('麵') || lower.includes('dough')) return '#e6c88b';
      if (lower.includes('鮮乳') || lower.includes('乳') || lower.includes('milk')) return '#f8fafc';
      if (lower.includes('沙拉醬') || lower.includes('mayo')) return '#fef08a';
      if (lower.includes('果汁') || lower.includes('juice')) {
        return isOxidized ? '#b45309' : '#f97316'; // brownish if oxidized, vibrant orange
      }
      if (lower.includes('發酵') || lower.includes('醪')) return '#ca8a04';
      if (lower.includes('粉') || lower.includes('咖啡')) return '#78350f';
      return '#38bdf8';
    };

    const render = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Rotation speed based on RPM
      const speedFactor = Math.min(0.25, (rpm / 1000) * 0.15 + 0.02);
      rotationAngle += speedFactor;
      coolantPhase += 0.05;
      particlePhase += 0.03;

      ctx.clearRect(0, 0, width, height);

      // Background ambient gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const centerX = width / 2;
      const centerY = height / 2 + 10;
      const tankWidth = Math.min(width * 0.58, 280);
      const tankHeight = Math.min(height * 0.62, 260);

      // Render mode
      if (activeTab === 'microstructure') {
        renderMicrostructure(ctx, centerX, centerY, tankWidth, tankHeight, particlePhase);
      } else if (activeTab === 'streamlines') {
        renderStreamlines(ctx, centerX, centerY, tankWidth, tankHeight, rotationAngle);
      } else {
        // Standard Vessel View
        renderVessel(ctx, centerX, centerY, tankWidth, tankHeight, rotationAngle, coolantPhase, particlePhase);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const renderVessel = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      tw: number,
      th: number,
      angle: number,
      cPhase: number,
      pPhase: number
    ) => {
      const left = cx - tw / 2;
      const top = cy - th / 2;
      const bottom = cy + th / 2;
      const cornerRadius = 24;

      if (equipment_type === 'v_mixer') {
        // V-Mixer Tumbler Custom Shape
        renderVMixerVessel(ctx, cx, cy, angle);
        return;
      }

      if (equipment_type === 'colloid_mill') {
        renderColloidMillVessel(ctx, cx, cy, angle);
        return;
      }

      if (equipment_type === 'pressure_homogenizer') {
        renderHomogenizerVessel(ctx, cx, cy, angle);
        return;
      }

      if (equipment_type === 'horizontal_kneader') {
        renderHorizontalKneaderVessel(ctx, cx, cy, tw, th, angle);
        return;
      }

      // 1. Cooling Jacket Layer (Outer)
      const jacketOffset = 18;
      ctx.beginPath();
      ctx.roundRect(left - jacketOffset, top + 15, tw + jacketOffset * 2, th - 10, [
        0,
        0,
        cornerRadius + 10,
        cornerRadius + 10,
      ]);
      ctx.lineWidth = 14;
      ctx.strokeStyle = cooling_jacket ? '#1e3a8a' : '#334155';
      ctx.stroke();

      // If cooling is active, draw circulating fluid waves
      if (cooling_jacket) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -cPhase * 25;
        ctx.stroke();
        ctx.restore();
      } else if (currentTemp > 15 && (raw_material.includes('肉') || raw_material.includes('貢丸'))) {
        // Hot thermal glow
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Inner Vessel Walls
      ctx.beginPath();
      ctx.roundRect(left, top, tw, th, [0, 0, cornerRadius, cornerRadius]);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      // 3. Fluid Body with Material Color
      const fluidTop = top + th * 0.28;
      const matColor = getMaterialColor();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(left + 4, fluidTop, tw - 8, bottom - fluidTop - 4, [0, 0, cornerRadius - 4, cornerRadius - 4]);
      ctx.clip();

      // Fluid Fill
      const fluidGrad = ctx.createLinearGradient(left, fluidTop, left, bottom);
      fluidGrad.addColorStop(0, matColor);
      fluidGrad.addColorStop(1, adjustColorBrightness(matColor, -30));
      ctx.fillStyle = fluidGrad;
      ctx.fillRect(left, fluidTop, tw, th);

      // Vortex Surface in low viscosity agitated systems
      const isLowVisc = !raw_material.includes('肉') && !raw_material.includes('麵') && !raw_material.includes('沙拉醬');
      if (isLowVisc && (equipment_type === 'paddle' || equipment_type === 'propeller' || equipment_type === 'turbine')) {
        const vortexDepth = has_baffles ? 6 : Math.min(65, (rpm / 1000) * 55 + 5);
        ctx.beginPath();
        ctx.moveTo(left, fluidTop);
        ctx.quadraticCurveTo(cx, fluidTop + vortexDepth, left + tw, fluidTop);
        ctx.lineTo(left + tw, fluidTop - 20);
        ctx.lineTo(left, fluidTop - 20);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        // Entrained Air Bubbles
        if (vortexDepth > 15) {
          const numBubbles = Math.min(24, Math.floor(vortexDepth / 2.5));
          for (let i = 0; i < numBubbles; i++) {
            const bx = cx + Math.sin(pPhase * 2 + i * 1.5) * (tw * 0.35 * (i / numBubbles));
            const by = fluidTop + vortexDepth * 0.6 + (i * (bottom - fluidTop - 40)) / numBubbles;
            const bRadius = 2 + (i % 3);
            ctx.beginPath();
            ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Dough / Surimi protein texture rendering
      if (raw_material.includes('肉') || raw_material.includes('貢丸')) {
        drawSurimiTexture(ctx, left, fluidTop, tw, bottom - fluidTop, isDenatured, pPhase);
      } else if (raw_material.includes('麵') || raw_material.includes('dough')) {
        drawDoughNetwork(ctx, left, fluidTop, tw, bottom - fluidTop, angle);
      }

      ctx.restore();

      // 4. Baffles (if enabled)
      if (has_baffles) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(left + 4, top + 30, 8, th * 0.7);
        ctx.fillRect(left + tw - 12, top + 30, 8, th * 0.7);
      }

      // 5. Agitator Shaft & Blades
      drawAgitatorShaft(ctx, cx, top, bottom, angle, cPhase);
    };

    const drawAgitatorShaft = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      top: number,
      bottom: number,
      angle: number,
      cPhase: number = 0
    ) => {
      // Shaft (竿子)
      const shaftWidth = 11;
      const bladeY = bottom - 45;

      // For non-propeller equipment, draw the continuous shaft down to the blade hub
      if (equipment_type !== 'propeller') {
        const shaftLength = bottom - 60 - (top - 25);
        const sGrad = ctx.createLinearGradient(cx - shaftWidth / 2, 0, cx + shaftWidth / 2, 0);
        sGrad.addColorStop(0.0, '#475569');
        sGrad.addColorStop(0.2, '#94a3b8');
        sGrad.addColorStop(0.45, '#ffffff');
        sGrad.addColorStop(0.7, '#cbd5e1');
        sGrad.addColorStop(1.0, '#334155');

        ctx.fillStyle = sGrad;
        ctx.fillRect(cx - shaftWidth / 2, top - 25, shaftWidth, shaftLength);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx - shaftWidth / 2, top - 25, shaftWidth, shaftLength);
      }

      ctx.save();
      ctx.translate(cx, bladeY);

      if (equipment_type === 'paddle') {
        // Flat paddle blades
        const cosScale = Math.cos(angle);
        const pWidth = 85 * cosScale;
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.fillRect(-pWidth / 2, -20, pWidth, 40);
        ctx.strokeRect(-pWidth / 2, -20, pWidth, 40);
      } else if (equipment_type === 'propeller') {
        // 316 Stainless Steel Laboratory 3-Blade Marine Propeller
        // 攪拌機竿子同心垂直貫穿裝配：竿子在 z-depth 介於後方旋轉葉片與輪轂/前方葉片之間，
        // 視覺呈現：轉動至後方的葉片會自然被中央的攪拌機不銹鋼竿子遮擋（竿子在前、後方葉片在後）！
        draw316MarinePropeller(ctx, 0, 0, {
          scale: 0.95,
          elevation: 0.38,
          azimuth: angle,
          showFlow: true,
          showAnnotations: false,
          isDetailView: false,
          flowPhase: cPhase,
          drawShaft: true,
          shaftTopY: (top - 25) - bladeY,
          shaftWidth: shaftWidth,
        });
      } else if (equipment_type === 'turbine') {
        // Rushton Turbine with multi blades
        const cosScale = Math.cos(angle * 2);
        ctx.fillStyle = '#e11d48';
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 2;

        ctx.fillRect(-45 * Math.abs(cosScale) - 8, -14, 90 * Math.abs(cosScale) + 16, 28);
        ctx.strokeRect(-45 * Math.abs(cosScale) - 8, -14, 90 * Math.abs(cosScale) + 16, 28);

        // Center disk
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (equipment_type === 'vertical_kneader') {
        // Attachment: Hook, Beater, or Whipper
        const att = attachment_type || 'hook';
        const swingX = Math.sin(angle) * 22;

        if (att === 'hook') {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 9;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, -25);
          ctx.lineTo(swingX, 0);
          ctx.bezierCurveTo(swingX + 35, 20, swingX - 30, 35, swingX + 10, 45);
          ctx.stroke();
        } else if (att === 'beater') {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 6;
          ctx.strokeRect(swingX - 25, -20, 50, 60);
          ctx.beginPath();
          ctx.moveTo(swingX - 25, 10);
          ctx.lineTo(swingX + 25, 10);
          ctx.stroke();
        } else {
          // Whipper
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.ellipse(swingX + i * 6, 10, 16 + Math.abs(i) * 4, 30, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    };

    const renderVMixerVessel = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 0.35);

      const armLength = 80;
      const armWidth = 45;

      // Draw V shape vessel
      ctx.beginPath();
      // Left Arm
      ctx.moveTo(0, 0);
      ctx.lineTo(-armLength * 0.7, -armLength);
      ctx.lineTo(-armLength * 0.7 + armWidth, -armLength - 10);
      ctx.lineTo(0, -20);
      // Right Arm
      ctx.lineTo(armLength * 0.7 - armWidth, -armLength - 10);
      ctx.lineTo(armLength * 0.7, -armLength);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, 25);
      ctx.closePath();

      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Powder particles tumbling inside V-arms
      const isDemixed = output?.extra_metrics?.segregation_de_mixing_index ? output.extra_metrics.segregation_de_mixing_index > 25 : false;
      const numParticles = 45;
      for (let i = 0; i < numParticles; i++) {
        const arm = i % 2 === 0 ? -1 : 1;
        const px = arm * (20 + (i % 5) * 8) + Math.sin(i * 3 + particlePhase) * 6;
        const py = -30 - (i % 7) * 8 + Math.cos(i * 2 + particlePhase) * 6;

        ctx.beginPath();
        // If demixed, large coffee particles float to top/outer, tiny creamer sinks
        if (isDemixed && i % 3 === 0) {
          ctx.arc(px * 1.2, py - 10, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#78350f'; // coarse coffee
        } else {
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a'; // fine creamer
        }
        ctx.fill();
      }

      ctx.restore();

      // Center pivot
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    const renderColloidMillVessel = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      // Conical Rotor & Stator Shearing Chamber
      const chamberW = 160;
      const chamberH = 180;
      const top = cy - chamberH / 2;

      // Outer Stator Housing
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - chamberW / 2, top);
      ctx.lineTo(cx - 30, top + chamberH);
      ctx.lineTo(cx + 30, top + chamberH);
      ctx.lineTo(cx + chamberW / 2, top);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner High Speed Rotor Cone
      ctx.save();
      const rotorW = 120 + Math.sin(angle * 4) * 2;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(cx - rotorW / 2, top + 20);
      ctx.lineTo(cx - 15, top + chamberH - 10);
      ctx.lineTo(cx + 15, top + chamberH - 10);
      ctx.lineTo(cx + rotorW / 2, top + 20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shearing micro-gap flow lines
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - chamberW / 2 + 10, top + 10);
      ctx.lineTo(cx - 20, top + chamberH);
      ctx.moveTo(cx + chamberW / 2 - 10, top + 10);
      ctx.lineTo(cx + 20, top + chamberH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    };

    const renderHomogenizerVessel = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      // High Pressure Homogenizer Micro-Orifice & Shockwave
      const blockW = 200;
      const blockH = 140;

      // High pressure steel block
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.strokeRect(cx - blockW / 2, cy - blockH / 2, blockW, blockH);
      ctx.fillRect(cx - blockW / 2, cy - blockH / 2, blockW, blockH);

      // Micro orifice channel
      const channelY = cy;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - blockW / 2 + 10, channelY - 15, 60, 30);
      // Narrow valve slit
      ctx.fillRect(cx - 30, channelY - 4, 30, 8);
      // Expansion Chamber
      ctx.fillRect(cx, channelY - 35, 80, 70);

      // Cavitation explosive shockwaves
      const pulse = (Math.sin(angle * 5) + 1) * 0.5;
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.6})`;
      ctx.lineWidth = 2 + pulse * 3;
      ctx.beginPath();
      ctx.arc(cx + 20, channelY, 15 + pulse * 25, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Micro Droplets dispersing
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        const dx = cx + 25 + Math.random() * 50;
        const dy = channelY - 25 + Math.random() * 50;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const renderHorizontalKneaderVessel = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      tw: number,
      th: number,
      angle: number
    ) => {
      // Dual W-shaped trough with counter-rotating Z-arms
      const left = cx - tw / 2;
      const top = cy - th / 2;
      const troughW = tw * 0.95;
      const troughH = th * 0.75;

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(cx - troughW / 2, cy - troughH / 2, troughW, troughH, 20);
      ctx.fill();
      ctx.stroke();

      // Material mass in trough
      ctx.fillStyle = getMaterialColor();
      ctx.beginPath();
      ctx.roundRect(cx - troughW / 2 + 8, cy - troughH / 2 + 20, troughW - 16, troughH - 28, 14);
      ctx.fill();

      // Two counter rotating Z-blade hubs
      const hub1X = cx - troughW * 0.22;
      const hub2X = cx + troughW * 0.22;
      const hubY = cy + 5;

      // Blade 1 (Z shape clockwise)
      drawZBlade(ctx, hub1X, hubY, angle * 1.5, '#f59e0b');
      // Blade 2 (Z shape counter-clockwise, differential speed)
      drawZBlade(ctx, hub2X, hubY, -angle * 1.8, '#f97316');
    };

    const drawZBlade = (
      ctx: CanvasRenderingContext2D,
      bx: number,
      by: number,
      bAngle: number,
      color: string
    ) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(bAngle);

      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-35, -25);
      ctx.lineTo(0, 0);
      ctx.lineTo(35, 25);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSurimiTexture = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      denatured: boolean,
      phase: number
    ) => {
      ctx.strokeStyle = denatured ? 'rgba(80, 50, 45, 0.4)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;

      // Draw elastic protein mesh lines
      for (let i = 0; i < 8; i++) {
        const offset = (i * h) / 8;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + offset);
        if (denatured) {
          // Fragmented clumps
          ctx.lineTo(x + w * 0.3, y + offset + 8);
          ctx.moveTo(x + w * 0.45, y + offset);
          ctx.lineTo(x + w * 0.8, y + offset - 6);
        } else {
          // Smooth intertwined wave ribbons
          ctx.bezierCurveTo(
            x + w * 0.3,
            y + offset + Math.sin(phase + i) * 12,
            x + w * 0.7,
            y + offset - Math.cos(phase + i) * 12,
            x + w - 10,
            y + offset
          );
        }
        ctx.stroke();
      }
    };

    const drawDoughNetwork = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      angle: number
    ) => {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const dy = y + (i * h) / 6 + 10;
        ctx.beginPath();
        ctx.moveTo(x + 15, dy);
        ctx.quadraticCurveTo(x + w / 2 + Math.sin(angle + i) * 20, dy + 15, x + w - 15, dy);
        ctx.stroke();
      }
    };

    const renderMicrostructure = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      tw: number,
      th: number,
      phase: number
    ) => {
      // Microscopic view (1000x zoom representation)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Zoom reticle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 120, cy);
      ctx.lineTo(cx + 120, cy);
      ctx.moveTo(cx, cy - 120);
      ctx.lineTo(cx, cy + 120);
      ctx.stroke();

      if (raw_material.includes('肉') || raw_material.includes('貢丸')) {
        // Myosin protein filament network
        ctx.strokeStyle = isDenatured ? '#ef4444' : '#22c55e';
        ctx.lineWidth = isDenatured ? 3 : 2;

        if (isDenatured) {
          // Clumped denatured aggregates
          for (let i = 0; i < 16; i++) {
            const px = cx + Math.sin(i * 1.2) * 75;
            const py = cy + Math.cos(i * 1.2) * 75;
            ctx.beginPath();
            ctx.arc(px, py, 10 + (i % 6), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // Intact continuous hexagonal mesh
          for (let r = 20; r <= 90; r += 25) {
            ctx.beginPath();
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
              const px = cx + Math.cos(a + phase * 0.5) * r;
              const py = cy + Math.sin(a + phase * 0.5) * r;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      } else {
        // Emulsion Droplet size view
        const dropletSize = output?.extra_metrics?.emulsion_droplet_d50_um || 15;
        const radius = Math.max(3, Math.min(28, dropletSize * 1.5));
        const numDroplets = Math.floor(250 / radius);

        for (let i = 0; i < numDroplets; i++) {
          const a = (i * 137.5 * Math.PI) / 180;
          const r = Math.sqrt(i / numDroplets) * 95;
          const dx = cx + Math.cos(a + phase) * r;
          const dy = cy + Math.sin(a + phase) * r;

          ctx.beginPath();
          ctx.arc(dx, dy, radius * (0.8 + (i % 3) * 0.15), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    const renderStreamlines = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      tw: number,
      th: number,
      angle: number
    ) => {
      // Computational Fluid Dynamics (CFD) Vector flow field
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2, cy - th / 2, tw, th, 16);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.stroke();

      const numRows = 7;
      const numCols = 7;
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const vx = cx - tw / 2 + 25 + (c * (tw - 50)) / (numCols - 1);
          const vy = cy - th / 2 + 30 + (r * (th - 60)) / (numRows - 1);
          const dist = Math.hypot(vx - cx, vy - (cy + 20));
          const vecAngle = Math.atan2(vy - (cy + 20), vx - cx) + Math.PI / 2 + (rpm / 1000) * 0.5;

          const len = Math.min(18, (rpm / 80) + 4);
          ctx.strokeStyle = dist < 50 ? '#f43f5e' : '#38bdf8';
          ctx.lineWidth = dist < 50 ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.lineTo(vx + Math.cos(vecAngle) * len, vy + Math.sin(vecAngle) * len);
          ctx.stroke();
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, [
    raw_material,
    equipment_type,
    rpm,
    cooling_jacket,
    attachment_type,
    has_baffles,
    output,
    activeTab,
    isDenatured,
    isOxidized,
    currentTemp,
  ]);

  // Utility to lighten/darken color
  function adjustColorBrightness(hex: string, percent: number) {
    let num = parseInt(hex.replace('#', ''), 16);
    if (isNaN(num)) return hex;
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00ff) + percent;
    let b = (num & 0x0000ff) + percent;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  return (
    <div className="bg-slate-850 border border-slate-750 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-750 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-base font-bold text-white tracking-wide">
            數位孿生動態流場與熱力學即時渲染 (Digital Twin)
          </h2>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-750 self-end sm:self-auto">
          <button
            type="button"
            id="tab-vessel-view"
            onClick={() => setActiveTab('vessel')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'vessel'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            槽體巨觀視角
          </button>
          <button
            type="button"
            id="tab-micro-view"
            onClick={() => setActiveTab('microstructure')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'microstructure'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            微觀分子構型
          </button>
          <button
            type="button"
            id="tab-streamlines-view"
            onClick={() => setActiveTab('streamlines')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'streamlines'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CFD 速度流線
          </button>
        </div>
      </div>

      {/* Canvas Area Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-750 bg-slate-950 shadow-inner select-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Real-time HUD Gauges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-xs font-mono flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">當前轉速:</span>
            <span className="text-amber-300 font-bold">{rpm} RPM</span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg backdrop-blur-md border text-xs font-mono flex items-center gap-1.5 shadow-md ${
              cooling_jacket
                ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                : 'bg-slate-900/85 border-slate-700/80 text-slate-400'
            }`}
          >
            {cooling_jacket ? (
              <>
                <Snowflake className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>夾套冰水循環：已就緒 (5°C)</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>冷卻夾套：未開啟 (絕熱生熱)</span>
              </>
            )}
          </div>
        </div>

        {/* Temperature & Quality Warning Badge */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none">
          <div
            className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-mono font-bold flex items-center gap-2 shadow-lg ${
              currentTemp <= 10
                ? 'bg-emerald-950/85 border-emerald-500/60 text-emerald-300'
                : currentTemp <= 15
                ? 'bg-amber-950/85 border-amber-500/60 text-amber-300'
                : 'bg-rose-950/85 border-rose-500/80 text-rose-200 animate-bounce'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            <span>槽內料溫：{currentTemp}°C</span>
          </div>

          {isDenatured && (
            <div className="px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500 text-[11px] font-bold text-rose-300 flex items-center gap-1 shadow-md">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>鹽溶性肌球蛋白熱變性！</span>
            </div>
          )}

          {isOxidized && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-500 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow-md">
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              <span>深漩渦捲入空氣 ➔ 氧化中</span>
            </div>
          )}
        </div>

        {/* Bottom Status bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-slate-300 pointer-events-auto flex items-center gap-2">
            <span>
              物料：<span className="text-white font-semibold">{raw_material}</span> | 設備：
              <span className="text-cyan-300 font-semibold">{equipment_type}</span>
            </span>
          </div>

          {output?.extra_metrics ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-slate-300">
                流況：<span className="text-amber-300 font-bold">{output.extra_metrics.flow_regime}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-slate-300">
                Re：<span className="text-cyan-300 font-bold">{output.extra_metrics.reynolds_number}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
