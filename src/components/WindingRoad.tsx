import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
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
  lineEmerald: '#50C878',
  milestoneCompleted: '#78909C',
  milestoneNext: '#FF1744',
  milestoneFuture: '#50C878',
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

// ─── Main component ──────────────────────────────────────────
interface WindingRoadProps {
  goal: Goal;
  /** Index of the milestone whose label is currently visible (-1 for none) */
  selectedMilestone: number;
  /** Called when a milestone circle is tapped */
  onMilestonePress: (index: number) => void;
}

export default function WindingRoad({
  goal,
  selectedMilestone,
  onMilestonePress,
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

      {/* ── Center dashes per segment ── */}
      {roadData.segments.map((seg, i) => {
        const isCompleted = i < clampedCompleted;
        return (
          <Path
            key={`dash-${i}`}
            d={seg.path}
            stroke={isCompleted ? COLORS.lineEmerald : COLORS.dashBlack}
            strokeWidth={isCompleted ? 5 : 4}
            strokeDasharray={isCompleted ? undefined : "18 12"}
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
            {/* Shadow */}
            <Circle
              cx={point.x + 2}
              cy={point.y + 3}
              r={MILESTONE_RADIUS}
              fill="rgba(0,0,0,0.3)"
            />
            {/* Circle */}
            <Circle
              cx={point.x}
              cy={point.y}
              r={MILESTONE_RADIUS}
              fill={fillColor}
              stroke={isSelected ? '#FFFFFF' : COLORS.milestoneStroke}
              strokeWidth={isSelected ? 4 : 3}
            />
            {/* Number */}
            <SvgText
              x={point.x}
              y={point.y + 5.5}
              textAnchor="middle"
              fontSize={16}
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
