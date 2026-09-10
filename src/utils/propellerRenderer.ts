/**
 * 316 Stainless Steel Laboratory 3-Blade Marine Propeller (316不銹鋼 實驗室三葉螺旋槳葉)
 * High-fidelity 3D projection rendering engine & fluid dynamics visualization
 */

export interface PropellerRenderOptions {
  scale?: number;
  elevation?: number; // Tilt angle in radians (default ~0.38 for perspective)
  azimuth?: number;   // Rotation angle in radians
  showFlow?: boolean; // Render downward axial flow streamlines
  showAnnotations?: boolean; // Render engineering callouts
  isDetailView?: boolean;
  flowPhase?: number;
  drawShaft?: boolean; // Render connected mixer rod/shaft
  shaftTopY?: number;  // Top coordinate of mixer shaft (e.g. motor chuck at top of tank)
  shaftWidth?: number; // Outer diameter of mixer rod
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x2d: number;
  y2d: number;
  depth: number;
}

// 3D projection with camera elevation angle
function projectPoint(p: Point3D, cx: number, cy: number, elevation: number): ProjectedPoint {
  const cosEl = Math.cos(elevation);
  const sinEl = Math.sin(elevation);
  return {
    x2d: cx + p.x,
    y2d: cy + p.y * cosEl - p.z * sinEl,
    depth: p.y * sinEl + p.z * cosEl,
  };
}

/**
 * Draw 316 Stainless Steel 3-Blade Marine Propeller Impeller
 */
export function draw316MarinePropeller(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  options: PropellerRenderOptions = {}
) {
  const {
    scale = 1.0,
    elevation = 0.38,
    azimuth = 0,
    showFlow = true,
    showAnnotations = false,
    isDetailView = false,
    flowPhase = 0,
    drawShaft = true,
    shaftTopY = -180 * scale,
    shaftWidth = 11 * scale,
  } = options;

  // Geometry dimensions
  const hubRadius = 13 * scale;
  const hubHeight = 26 * scale;
  const boreRadius = 6 * scale;
  const bladeTipRadius = 52 * scale;
  const maxBladeWidth = 28 * scale;
  const pitchAngle = 0.48; // ~27.5 degrees (axial downward pumping pitch)
  const hubTopY = cy - (hubHeight / 2) * Math.cos(elevation);

  const elementsToSort: {
    type: 'blade' | 'hub' | 'shaft';
    index: number;
    depth: number;
  }[] = [];

  // 1. Calculate 3 blades' geometry and depths
  const bladesData: {
    points: ProjectedPoint[];
    rootPt: ProjectedPoint;
    tipPt: ProjectedPoint;
    midPt: ProjectedPoint;
    angle: number;
  }[] = [];

  for (let b = 0; b < 3; b++) {
    // 3 blades spaced 120 degrees (2*PI / 3) apart
    const bladeAngle = azimuth + (b * 2 * Math.PI) / 3;
    const cosA = Math.cos(bladeAngle);
    const sinA = Math.sin(bladeAngle);

    // Unit vectors
    const ur = { x: cosA, y: 0, z: sinA };        // radial
    const ut = { x: -sinA, y: 0, z: cosA };       // tangential
    const uy = { x: 0, y: 1, z: 0 };              // axial down

    // Pitch chord vector (tilted by pitch angle)
    const uc = {
      x: ut.x * Math.cos(pitchAngle) + uy.x * Math.sin(pitchAngle),
      y: ut.y * Math.cos(pitchAngle) + uy.y * Math.sin(pitchAngle),
      z: ut.z * Math.cos(pitchAngle) + uy.z * Math.sin(pitchAngle),
    };

    const numSpanSteps = 10;
    const perimeter3D: Point3D[] = [];

    // Root attachment (s = 0)
    const rHub = hubRadius * 0.92;
    const rootWidth = maxBladeWidth * 0.38;

    // Trailing edge from root to tip (u = +0.5)
    for (let i = 0; i <= numSpanSteps; i++) {
      const s = i / numSpanSteps; // 0 to 1
      const r = rHub + s * (bladeTipRadius - rHub);
      // Characteristic spoon shape: narrow root, widest at ~65% span, smooth curve
      const w = maxBladeWidth * (0.35 + 1.25 * Math.sin(Math.PI * Math.pow(s, 0.75)));
      const u = 0.5; // trailing edge
      const camber = -(0.25 - u * u) * 0.2 * w;

      perimeter3D.push({
        x: r * ur.x + u * w * uc.x,
        y: r * ur.y + u * w * uc.y + camber,
        z: r * ur.z + u * w * uc.z,
      });
    }

    // Rounded tip arc (s = 1)
    const tipCenterR = bladeTipRadius;
    const tipWidth = maxBladeWidth * 0.55;
    const tipSteps = 5;
    for (let j = 1; j <= tipSteps; j++) {
      const u = 0.5 - j / tipSteps; // +0.5 to -0.5
      const arcR = tipCenterR + Math.sin((j / tipSteps) * Math.PI) * (tipWidth * 0.25);
      perimeter3D.push({
        x: arcR * ur.x + u * tipWidth * uc.x,
        y: arcR * ur.y + u * tipWidth * uc.y,
        z: arcR * ur.z + u * tipWidth * uc.z,
      });
    }

    // Leading edge from tip back to root (u = -0.5)
    for (let i = numSpanSteps; i >= 0; i--) {
      const s = i / numSpanSteps;
      const r = rHub + s * (bladeTipRadius - rHub);
      const w = maxBladeWidth * (0.35 + 1.25 * Math.sin(Math.PI * Math.pow(s, 0.75)));
      const u = -0.5; // leading edge
      const camber = -(0.25 - u * u) * 0.2 * w;

      perimeter3D.push({
        x: r * ur.x + u * w * uc.x,
        y: r * ur.y + u * w * uc.y + camber,
        z: r * ur.z + u * w * uc.z,
      });
    }

    // Project points
    const projPoints = perimeter3D.map((p) => projectPoint(p, cx, cy, elevation));
    const rootPt = projectPoint(
      { x: rHub * ur.x, y: 0, z: rHub * sinA },
      cx,
      cy,
      elevation
    );
    const midPt = projectPoint(
      {
        x: (rHub + 0.65 * (bladeTipRadius - rHub)) * ur.x,
        y: 0,
        z: (rHub + 0.65 * (bladeTipRadius - rHub)) * sinA,
      },
      cx,
      cy,
      elevation
    );
    const tipPt = projectPoint(
      { x: bladeTipRadius * ur.x, y: 0, z: bladeTipRadius * sinA },
      cx,
      cy,
      elevation
    );

    bladesData.push({
      points: projPoints,
      rootPt,
      tipPt,
      midPt,
      angle: bladeAngle,
    });

    elementsToSort.push({
      type: 'blade',
      index: b,
      depth: midPt.depth,
    });
  }

  // Add Shaft to sorting list (depth = 0.05, in front of rear blades, behind front blades)
  if (drawShaft) {
    elementsToSort.push({
      type: 'shaft',
      index: 0,
      depth: 0.05,
    });
  }

  // Add Hub to sorting list
  elementsToSort.push({
    type: 'hub',
    index: 0,
    depth: 0.1, // Hub center
  });

  // Sort back-to-front by depth
  elementsToSort.sort((a, b) => a.depth - b.depth);

  // 2. Render sorted elements
  for (const item of elementsToSort) {
    if (item.type === 'blade') {
      const blade = bladesData[item.index];
      renderSingleBlade(ctx, blade, isDetailView);
    } else if (item.type === 'shaft') {
      renderMixerShaft(ctx, cx, cy, shaftTopY, hubTopY, shaftWidth, Math.sin(elevation));
    } else {
      renderHub(ctx, cx, cy, hubRadius, hubHeight, boreRadius, elevation, azimuth, isDetailView, scale);
    }
  }

  // 3. Render Downward Axial Flow Streamlines (推進軸向流)
  if (showFlow) {
    renderAxialFlowVectors(ctx, cx, cy, bladeTipRadius, hubRadius, flowPhase, isDetailView);
  }

  // 4. Engineering annotations (if enabled in detail view)
  if (showAnnotations && isDetailView) {
    renderEngineeringCallouts(ctx, cx, cy, bladeTipRadius, hubRadius, hubHeight, scale);
  }
}

/**
 * Render one marine propeller blade with 316 Stainless Steel specular reflection
 */
function renderSingleBlade(
  ctx: CanvasRenderingContext2D,
  blade: {
    points: ProjectedPoint[];
    rootPt: ProjectedPoint;
    tipPt: ProjectedPoint;
    midPt: ProjectedPoint;
    angle: number;
  },
  isDetailView: boolean
) {
  if (blade.points.length < 3) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(blade.points[0].x2d, blade.points[0].y2d);
  for (let i = 1; i < blade.points.length; i++) {
    ctx.lineTo(blade.points[i].x2d, blade.points[i].y2d);
  }
  ctx.closePath();

  // Polished 316 Stainless Steel dynamic gradient
  const grad = ctx.createLinearGradient(
    blade.rootPt.x2d,
    blade.rootPt.y2d,
    blade.tipPt.x2d,
    blade.tipPt.y2d
  );

  // Metallic chrome color stops
  grad.addColorStop(0.0, '#475569'); // root junction shadow
  grad.addColorStop(0.2, '#94a3b8'); // steel body
  grad.addColorStop(0.45, '#ffffff'); // bright specular glint highlight
  grad.addColorStop(0.65, '#e2e8f0'); // clean steel
  grad.addColorStop(0.85, '#94a3b8'); // curvature shadow
  grad.addColorStop(1.0, '#cbd5e1'); // smooth rounded tip

  ctx.fillStyle = grad;
  ctx.fill();

  // Crisp precision boundary
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = isDetailView ? 2 : 1.2;
  ctx.stroke();

  // Subtle specular ridge reflection line along camber
  ctx.beginPath();
  ctx.moveTo(blade.rootPt.x2d, blade.rootPt.y2d);
  ctx.quadraticCurveTo(blade.midPt.x2d, blade.midPt.y2d, blade.tipPt.x2d, blade.tipPt.y2d);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = isDetailView ? 2 : 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Render continuous stainless steel mixer drive rod (攪拌機不銹鋼竿子)
 * Rendered at z-depth between rear blades and hub/front blades so that:
 * - Rear blades rotating behind the central axis are visibly occluded by the solid metallic rod.
 * - Shaft enters seamlessly into the top collar of the propeller hub with contact shadow and metallic specular reflection.
 */
function renderMixerShaft(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  shaftTopY: number,
  hubTopY: number,
  shaftWidth: number,
  sinEl: number
) {
  ctx.save();
  const sRadius = shaftWidth / 2;
  const sRy = sRadius * Math.max(0.18, sinEl);

  // 1. Contact shadow cast from shaft onto rear blades behind it (增強實體竿子遮擋後方葉片的景深立體感)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
  ctx.fillRect(cx - sRadius - 2, shaftTopY, shaftWidth + 4, (hubTopY + 3) - shaftTopY);

  // 2. Continuous 316 Stainless Steel Shaft Cylinder (竿子實體圓柱)
  ctx.beginPath();
  ctx.moveTo(cx - sRadius, shaftTopY);
  ctx.lineTo(cx - sRadius, hubTopY + 3);
  ctx.lineTo(cx + sRadius, hubTopY + 3);
  ctx.lineTo(cx + sRadius, shaftTopY);
  ctx.closePath();

  const shaftGrad = ctx.createLinearGradient(cx - sRadius, 0, cx + sRadius, 0);
  shaftGrad.addColorStop(0.0, '#334155');
  shaftGrad.addColorStop(0.16, '#64748b');
  shaftGrad.addColorStop(0.42, '#ffffff'); // bright light reflection line
  shaftGrad.addColorStop(0.68, '#cbd5e1');
  shaftGrad.addColorStop(1.0, '#1e293b');

  ctx.fillStyle = shaftGrad;
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3. Top end cap where shaft enters the motor chuck at top of vessel
  ctx.beginPath();
  ctx.ellipse(cx, shaftTopY, sRadius, sRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Render Central Hub Cylinder seamlessly connected with mixer drive shaft
 * (裝上攪拌機竿子時，上方與側邊無可視外露圓孔，表面平滑衛生密封)
 */
function renderHub(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  height: number,
  boreRadius: number,
  elevation: number,
  azimuth: number,
  isDetailView: boolean,
  scale: number
) {
  ctx.save();
  const cosEl = Math.cos(elevation);
  const sinEl = Math.sin(elevation);

  const topY = cy - (height / 2) * cosEl;
  const botY = cy + (height / 2) * cosEl;
  const ry = radius * sinEl;

  // Hub Cylinder Body (衛生級光滑圓柱無孔外壁，側邊無可視圓孔/螺栓孔)
  ctx.beginPath();
  ctx.moveTo(cx - radius, topY);
  ctx.lineTo(cx - radius, botY);
  ctx.ellipse(cx, botY, radius, ry, 0, 0, Math.PI);
  ctx.lineTo(cx + radius, topY);
  ctx.ellipse(cx, topY, radius, ry, 0, 0, Math.PI, true);
  ctx.closePath();

  const bodyGrad = ctx.createLinearGradient(cx - radius, 0, cx + radius, 0);
  bodyGrad.addColorStop(0.0, '#334155');
  bodyGrad.addColorStop(0.18, '#64748b');
  bodyGrad.addColorStop(0.38, '#ffffff'); // bright light band
  bodyGrad.addColorStop(0.55, '#e2e8f0');
  bodyGrad.addColorStop(0.8, '#94a3b8');
  bodyGrad.addColorStop(1.0, '#1e293b');

  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = isDetailView ? 2 : 1.2;
  ctx.stroke();

  // 3. Top Collar Face & Continuous Shaft Joint (上方接合面：與攪拌桿緊密同心連接，無可視暗孔)
  ctx.beginPath();
  ctx.ellipse(cx, topY, radius, ry, 0, 0, Math.PI * 2);
  const topGrad = ctx.createLinearGradient(cx - radius, topY - ry, cx + radius, topY + ry);
  topGrad.addColorStop(0.0, '#ffffff');
  topGrad.addColorStop(0.5, '#cbd5e1');
  topGrad.addColorStop(1.0, '#64748b');
  ctx.fillStyle = topGrad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = isDetailView ? 2 : 1.2;
  ctx.stroke();

  // Shaft interface collar ring (實心同心裝配介面，完全填滿無開放圓孔)
  const shaftRingR = Math.max(4.5 * scale, boreRadius * 0.9);
  ctx.beginPath();
  ctx.ellipse(cx, topY, shaftRingR, shaftRingR * sinEl, 0, 0, Math.PI * 2);
  const ringGrad = ctx.createLinearGradient(cx - shaftRingR, 0, cx + shaftRingR, 0);
  ringGrad.addColorStop(0.0, '#475569');
  ringGrad.addColorStop(0.38, '#ffffff');
  ringGrad.addColorStop(0.7, '#cbd5e1');
  ringGrad.addColorStop(1.0, '#334155');
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Downward Axial Flow Streamlines (軸向向下強力推進流)
 */
function renderAxialFlowVectors(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bladeTipRadius: number,
  hubRadius: number,
  flowPhase: number,
  isDetailView: boolean
) {
  ctx.save();
  const numStreams = isDetailView ? 6 : 4;
  const flowLength = isDetailView ? 90 : 45;

  for (let i = 0; i < numStreams; i++) {
    const angleOffset = (i / numStreams) * Math.PI * 2;
    const rSpread = hubRadius * 1.1 + (i % 2) * (bladeTipRadius * 0.45);
    const sx = cx + Math.cos(angleOffset) * rSpread;
    const sy = cy + 10;

    // Moving particle offset
    const phaseOffset = (flowPhase * 35 + i * 20) % flowLength;
    const curY = sy + phaseOffset;

    // Downward arrow
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (sx - cx) * 0.15, curY);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arrowhead at tip
    const arrowY = curY;
    const arrowX = sx + (sx - cx) * 0.15;
    ctx.beginPath();
    ctx.moveTo(arrowX - 4, arrowY - 6);
    ctx.lineTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 4, arrowY - 6);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Engineering Callouts in Detail View
 */
function renderEngineeringCallouts(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bladeTipRadius: number,
  hubRadius: number,
  hubHeight: number,
  scale: number
) {
  ctx.save();
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';

  // 1. Material & Spec Top Badge
  const topText = '316 不銹鋼 (AISI 316L / SUS316)';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(topText, cx - 180, cy - 140);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('實驗室標準三葉螺旋槳葉 (Marine Propeller Impeller)', cx - 180, cy - 124);
  ctx.fillText('鏡面電解拋光 (Ra < 0.4 µm 衛生級表面)', cx - 180, cy - 110);

  // Leader line to blade surface
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy - 105);
  ctx.lineTo(cx - 80, cy - 110);
  ctx.stroke();

  // 2. Mixer Shaft Connection Callout (竿子連接無孔洞設計)
  ctx.setLineDash([]);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('攪拌機不銹鋼驅動桿同心連接 (Mixer Shaft Coupling)', cx + 55, cy - 65);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('竿子緊密組裝接合，上方與外壁一體密封無外露孔洞', cx + 55, cy - 50);

  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(cx + Math.max(10, hubRadius * 0.7), cy - hubHeight * 0.4);
  ctx.lineTo(cx + 50, cy - 60);
  ctx.stroke();

  // 3. 120° Symmetry & Pitch Callout
  ctx.fillStyle = '#34d399';
  ctx.fillText('120° 等距弧形推進曲面 (Pitch 28°)', cx - 180, cy + 120);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('強力向下軸向流 (High Axial Circulation)', cx - 180, cy + 135);

  ctx.strokeStyle = '#34d399';
  ctx.beginPath();
  ctx.moveTo(cx - bladeTipRadius * 0.6, cy + 35);
  ctx.lineTo(cx - 80, cy + 115);
  ctx.stroke();

  ctx.restore();
}

function radiusTo(r: number) {
  return r;
}
