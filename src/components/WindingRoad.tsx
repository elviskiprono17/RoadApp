import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Dimensions, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  Rect,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import type { Goal } from '../types/goal';
import { useTheme } from '../context/ThemeContext';
import RoadsideDoodles from './RoadsideDoodles';


// ─── Constants ───────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const SVG_WIDTH = SCREEN_WIDTH;
const ROAD_WIDTH = 72;
const SEGMENT_HEIGHT = 260;
const PADDING_TOP = 105;
const PADDING_BOTTOM = 120;
const CENTER_X = SVG_WIDTH / 2;
const AMPLITUDE = SVG_WIDTH * 0.26;
const MILESTONE_RADIUS = 28;

// ─── Colors ──────────────────────────────────────────────────
const COLORS = {
  road: '#F5C518',
  roadEdge: '#C9A000',
  roadShadow: 'rgba(0,0,0,0.25)',
  dashBlack: '#111111',
  lineEmerald: '#1B8A4A',
  milestoneCompleted: '#78909C',
  milestoneNext: '#FF1744',
  milestoneFuture: '#1B8A4A',
  milestoneStroke: '#FFFFFF',
  finishBlack: '#111111',
  finishWhite: '#FFFFFF',
  labelColor: '#E0E0E0',
};

// ─── Road data generation ────────────────────────────────────
interface MilestonePoint {
  x: number;
  y: number;
  index: number;
}

interface RoadSegment {
  path: string;
}

interface RoadData {
  fullPath: string;
  segments: RoadSegment[];
  milestonePoints: MilestonePoint[];
  totalHeight: number;
  finishPoint: { x: number; y: number };
}

function generateRoadData(numMilestones: number): RoadData {
  // totalHeight: PADDING_TOP places the last milestone so the finish line
  // ends up flush with the top of the SVG (touching the navbar).
  const totalHeight =
    PADDING_TOP + PADDING_BOTTOM + numMilestones * SEGMENT_HEIGHT;

  // Milestone positions (ordered bottom → top)
  // All milestones except the last alternate left/right;
  // the LAST milestone is centered at CENTER_X at the tip of the road.
  const milestonePoints: MilestonePoint[] = [];
  for (let i = 0; i < numMilestones; i++) {
    const y = totalHeight - PADDING_BOTTOM - (i + 1) * SEGMENT_HEIGHT;
    const isLast = i === numMilestones - 1;
    const x = isLast
      ? CENTER_X
      : CENTER_X + (i % 2 === 0 ? AMPLITUDE : -AMPLITUDE);
    milestonePoints.push({ x, y, index: i });
  }

  // The last milestone is at the very top/tip of the road
  const lastMilestone = milestonePoints[numMilestones - 1];

  // Finish line sits just above the last milestone with a gap
  const finishPoint = { x: CENTER_X, y: lastMilestone.y - 80 };

  // Build path and segments
  const startX = CENTER_X;
  const startY = totalHeight - PADDING_BOTTOM;
  let fullPath = `M ${startX} ${startY}`;
  const segments: RoadSegment[] = [];

  let prevX = startX;
  let prevY = startY;

  for (let i = 0; i < numMilestones; i++) {
    const tx = milestonePoints[i].x;
    const ty = milestonePoints[i].y;
    const cp1x = prevX;
    const cp1y = prevY - SEGMENT_HEIGHT * 0.45;
    const cp2x = tx;
    const cp2y = ty + SEGMENT_HEIGHT * 0.45;

    const curve = `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${tx} ${ty}`;
    fullPath += ` ${curve}`;
    segments.push({ path: `M ${prevX} ${prevY} ${curve}` });

    prevX = tx;
    prevY = ty;
  }

  // No extra segment beyond the last milestone
  return { fullPath, segments, milestonePoints, totalHeight, finishPoint };
}

// ─── Approximate Bézier curve length ─────────────────────────
// Uses adaptive subdivision to estimate cubic Bézier arc length.
function cubicBezierLength(
  x0: number, y0: number,
  cx1: number, cy1: number,
  cx2: number, cy2: number,
  x1: number, y1: number,
  steps: number = 64
): number {
  let length = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * x1;
    const y = u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y1;
    const dx = x - px;
    const dy = y - py;
    length += Math.sqrt(dx * dx + dy * dy);
    px = x;
    py = y;
  }
  return length;
}

// Parse a segment path "M x0 y0 C cx1 cy1 cx2 cy2 x1 y1" and compute its length
function getSegmentLength(segPath: string): number {
  const nums = segPath.match(/-?[\d.]+/g);
  if (!nums || nums.length < 8) return SEGMENT_HEIGHT;
  const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = nums.map(Number);
  return cubicBezierLength(x0, y0, cx1, cy1, cx2, cy2, x1, y1);
}

// ─── Build a path that is a sub-path of a segment up to fraction t ──
function getPartialSegmentPath(segPath: string, fraction: number): string {
  const nums = segPath.match(/-?[\d.]+/g);
  if (!nums || nums.length < 8 || fraction <= 0) return '';
  const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = nums.map(Number);

  const clampedT = Math.min(1, Math.max(0, fraction));

  // De Casteljau split at t — get the "left" sub-curve
  const t = clampedT;
  // Level 1
  const ax = x0 + t * (cx1 - x0);
  const ay = y0 + t * (cy1 - y0);
  const bx = cx1 + t * (cx2 - cx1);
  const by = cy1 + t * (cy2 - cy1);
  const cx = cx2 + t * (x1 - cx2);
  const cy = cy2 + t * (y1 - cy2);
  // Level 2
  const dx = ax + t * (bx - ax);
  const dy = ay + t * (by - ay);
  const ex = bx + t * (cx - bx);
  const ey = by + t * (cy - by);
  // Level 3 (point on curve)
  const fx = dx + t * (ex - dx);
  const fy = dy + t * (ey - dy);

  return `M ${x0} ${y0} C ${ax} ${ay} ${dx} ${dy} ${fx} ${fy}`;
}

// ─── Finish line component — wide horizontal banner ──────────
function FinishLine({ x, y }: { x: number; y: number }) {
  const squareSize = 14;
  const bannerWidth = SVG_WIDTH;
  const cols = Math.ceil(bannerWidth / squareSize);
  const rows = 3;
  const totalW = cols * squareSize;
  const totalH = rows * squareSize;
  const startX = (SVG_WIDTH - totalW) / 2;
  const startY = y - totalH / 2;

  const squares: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isBlack = (r + c) % 2 === 0;
      squares.push(
        <Rect
          key={`f-${r}-${c}`}
          x={startX + c * squareSize}
          y={startY + r * squareSize}
          width={squareSize}
          height={squareSize}
          fill={isBlack ? COLORS.finishBlack : COLORS.finishWhite}
        />,
      );
    }
  }

  return (
    <G>
      {/* Outer border (stretching full width) */}
      <Rect
        x={startX}
        y={startY - 4}
        width={totalW}
        height={totalH + 8}
        fill="rgba(255,255,255,0.15)"
      />
      {/* Background behind checkered */}
      <Rect
        x={startX}
        y={startY - 2}
        width={totalW}
        height={totalH + 4}
        fill="rgba(0,0,0,0.5)"
      />
      {squares}
    </G>
  );
}
// ─── Pulsing milestone circle ────────────────────────────────
interface PulsingMilestoneProps {
  cx: number;
  cy: number;
  fillColor: string;
  isSelected: boolean;
  index: number;
}

function PulsingMilestone({ cx, cy, fillColor, isSelected, index }: PulsingMilestoneProps) {
  const [scale, setScale] = useState(1);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Listen to animated value and update state for SVG
    const id = animValue.addListener(({ value }) => {
      setScale(0.92 + value * 0.16); // 0.92 → 1.08
    });

    // Stagger the start so milestones don't all pulse in sync
    const delay = index * 200;
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animValue.removeListener(id);
    };
  }, []);

  return (
    <G
      // @ts-ignore — react-native-svg G supports origin/scale but TS types may lag
      origin={`${cx}, ${cy}`}
      scale={scale}
    >
      {/* Shadow */}
      <Circle
        cx={cx + 2}
        cy={cy + 3}
        r={MILESTONE_RADIUS}
        fill="rgba(0,0,0,0.3)"
      />
      {/* Circle */}
      <Circle
        cx={cx}
        cy={cy}
        r={MILESTONE_RADIUS}
        fill={fillColor}
        stroke={isSelected ? '#FFFFFF' : COLORS.milestoneStroke}
        strokeWidth={isSelected ? 4 : 3}
      />
    </G>
  );
}

// ─── Main component ──────────────────────────────────────────
interface WindingRoadProps {
  goal: Goal;
  /** Index of the milestone whose label is currently visible (-1 for none) */
  selectedMilestone: number;
  /** Called when a milestone circle is tapped */
  onMilestonePress: (index: number) => void;
  /**
   * Overall progress fraction (0–1) across the entire road.
   * When provided, the green line fills continuously to this point.
   * Falls back to milestone-count-based calculation if not provided.
   */
  progressFraction?: number;
}

export default function WindingRoad({
  goal,
  selectedMilestone,
  onMilestonePress,
  progressFraction,
}: WindingRoadProps) {
  const numMilestones = goal.milestones.length;

  const roadData = useMemo(
    () => generateRoadData(numMilestones),
    [numMilestones],
  );

  const { theme } = useTheme();

  // Calculate how many milestones are completed
  const completedCount = useMemo(() => {
    if (goal.type === 'numerical') {
      // Count milestones whose value has been passed
      return goal.milestones.filter(
        (m) => m.value !== undefined && goal.currentValue >= m.value,
      ).length;
    }
    return goal.milestones.filter((m) => m.completed).length;
  }, [goal]);

  const clampedCompleted = Math.min(completedCount, numMilestones);

  // Calculate the actual progress fraction for the green line.
  // This determines how far along the road the green line extends,
  // including partial fill between milestones.
  const effectiveProgressFraction = useMemo(() => {
    if (progressFraction !== undefined) return Math.min(1, Math.max(0, progressFraction));

    if (goal.type === 'numerical') {
      // For numerical goals, progress is currentValue / targetValue
      // mapped linearly across all segments
      if (!goal.targetValue || goal.targetValue <= 0) return 0;
      return Math.min(1, Math.max(0, goal.currentValue / goal.targetValue));
    }

    // For custom goals, calculate based on completed milestones + sub-milestone progress
    if (numMilestones === 0) return 0;

    let totalProgress = 0;
    for (let i = 0; i < numMilestones; i++) {
      const m = goal.milestones[i];
      if (m.completed) {
        totalProgress += 1;
      } else if (m.subMilestones && m.subMilestones.length > 0) {
        // Partial progress within this milestone based on sub-milestones
        const completedSubs = m.subMilestones.filter((s) => s.completed).length;
        totalProgress += completedSubs / m.subMilestones.length;
        break; // Only the first incomplete milestone can have partial progress
      } else {
        break; // No sub-milestones, stop here
      }
    }

    return Math.min(1, totalProgress / numMilestones);
  }, [goal, numMilestones, progressFraction]);

  // Pre-compute segment lengths for fractional mapping
  const segmentLengths = useMemo(() => {
    return roadData.segments.map((seg) => getSegmentLength(seg.path));
  }, [roadData]);

  const totalRoadLength = useMemo(() => {
    return segmentLengths.reduce((sum, l) => sum + l, 0);
  }, [segmentLengths]);

  // Map effectiveProgressFraction to per-segment fill fractions
  const segmentFillFractions = useMemo(() => {
    const fractions: number[] = new Array(numMilestones).fill(0);
    if (totalRoadLength === 0 || effectiveProgressFraction <= 0) return fractions;

    let targetLength = effectiveProgressFraction * totalRoadLength;
    for (let i = 0; i < numMilestones; i++) {
      const segLen = segmentLengths[i];
      if (targetLength >= segLen) {
        fractions[i] = 1;
        targetLength -= segLen;
      } else {
        fractions[i] = targetLength / segLen;
        targetLength = 0;
        break;
      }
    }
    return fractions;
  }, [effectiveProgressFraction, totalRoadLength, segmentLengths, numMilestones]);

  return (
    <Svg
      width={SVG_WIDTH}
      height={roadData.totalHeight}
      viewBox={`0 0 ${SVG_WIDTH} ${roadData.totalHeight}`}
    >
      <Defs>
        <LinearGradient id="roadGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={COLORS.roadEdge} />
          <Stop offset="0.3" stopColor={COLORS.road} />
          <Stop offset="0.7" stopColor={COLORS.road} />
          <Stop offset="1" stopColor={COLORS.roadEdge} />
        </LinearGradient>
      </Defs>

      {/* ── Roadside doodles (behind road) ── */}
      <RoadsideDoodles
        theme={theme}
        milestonePoints={roadData.milestonePoints}
        totalHeight={roadData.totalHeight}
        svgWidth={SVG_WIDTH}
        amplitude={AMPLITUDE}
        centerX={CENTER_X}
      />

      {/* ── Road shadow ── */}
      <Path
        d={roadData.fullPath}
        stroke={COLORS.roadShadow}
        strokeWidth={ROAD_WIDTH + 8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Road body ── */}
      <Path
        d={roadData.fullPath}
        stroke="url(#roadGradient)"
        strokeWidth={ROAD_WIDTH}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Road edge lines ── */}
      <Path
        d={roadData.fullPath}
        stroke={COLORS.roadEdge}
        strokeWidth={ROAD_WIDTH + 4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.4}
      />
      <Path
        d={roadData.fullPath}
        stroke={COLORS.road}
        strokeWidth={ROAD_WIDTH - 2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Center dashes + smooth green progress line ── */}
      {roadData.segments.map((seg, i) => {
        const fill = segmentFillFractions[i];

        if (fill >= 1) {
          // Fully completed segment — solid green line
          return (
            <Path
              key={`dash-${i}`}
              d={seg.path}
              stroke={COLORS.lineEmerald}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
          );
        }

        if (fill > 0) {
          // Partially filled segment — black dashes underneath, green partial on top
          const partialPath = getPartialSegmentPath(seg.path, fill);
          return (
            <G key={`dash-${i}`}>
              {/* Full segment as black dashes */}
              <Path
                d={seg.path}
                stroke={COLORS.dashBlack}
                strokeWidth={4}
                strokeDasharray="18 12"
                fill="none"
                strokeLinecap="round"
              />
              {/* Green partial fill */}
              {partialPath ? (
                <Path
                  d={partialPath}
                  stroke={COLORS.lineEmerald}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                />
              ) : null}
            </G>
          );
        }

        // Unfilled segment — black dashes only
        return (
          <Path
            key={`dash-${i}`}
            d={seg.path}
            stroke={COLORS.dashBlack}
            strokeWidth={4}
            strokeDasharray="18 12"
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      {/* ── Finish line ── */}
      <FinishLine x={roadData.finishPoint.x} y={roadData.finishPoint.y} />

      {/* ── Milestone markers ── */}
      {roadData.milestonePoints.map((point, i) => {
        const milestone = goal.milestones[i];
        if (!milestone) return null;

        let fillColor: string;
        if (i < clampedCompleted) {
          fillColor = COLORS.milestoneCompleted; // Grey — passed
        } else if (i === clampedCompleted) {
          fillColor = COLORS.milestoneNext; // Red — next target
        } else {
          fillColor = COLORS.milestoneFuture; // Green — future
        }

        // Label position: on opposite side of the road curve
        const isLast = i === numMilestones - 1;
        const labelOnRight = isLast ? true : i % 2 === 0;
        const labelX = labelOnRight ? point.x + 34 : point.x - 34;
        const labelAnchor = labelOnRight ? 'start' : 'end';

        const isSelected = selectedMilestone === i;

        return (
          <G key={`ms-${i}`} onPress={() => onMilestonePress(i)}>
            {/* Pulsing milestone group — scale around center */}
            <PulsingMilestone
              cx={point.x}
              cy={point.y}
              fillColor={fillColor}
              isSelected={isSelected}
              index={i}
            />
            {/* Number */}
            <SvgText
              x={point.x}
              y={point.y + 7}
              textAnchor="middle"
              fontSize={20}
              fontWeight="bold"
              fontFamily="sans-serif"
              fill="#FFFFFF"
            >
              {i + 1}
            </SvgText>
            {/* Label — only shown when tapped */}
            {isSelected && (
              <>
                {/* Label background */}
                <Rect
                  x={labelOnRight ? labelX - 6 : labelX - (Math.min(milestone.label.length, 18) * 6.5) - 6}
                  y={point.y - 12}
                  width={Math.min(milestone.label.length, 18) * 6.5 + 12}
                  height={26}
                  rx={8}
                  fill="rgba(0,0,0,0.7)"
                />
                <SvgText
                  x={labelX}
                  y={point.y + 5}
                  textAnchor={labelAnchor}
                  fontSize={12}
                  fontWeight="600"
                  fill={COLORS.labelColor}
                >
                  {milestone.label.length > 18
                    ? milestone.label.slice(0, 16) + '…'
                    : milestone.label}
                </SvgText>
              </>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

export { generateRoadData, SEGMENT_HEIGHT, PADDING_TOP, PADDING_BOTTOM };
