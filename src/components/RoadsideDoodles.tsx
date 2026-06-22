import React from 'react';
import { G, Path, Circle, Ellipse, Line, Rect } from 'react-native-svg';
import type { ThemeName } from '../context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────
interface DoodleProps {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
}

interface RoadsideDoodlesProps {
  theme: ThemeName;
  milestonePoints: { x: number; y: number; index: number }[];
  totalHeight: number;
  svgWidth: number;
  amplitude: number;
  centerX: number;
}

// ─── Style Configuration ─────────────────────────────────────
// Soft dimmed white stroke color to prevent it being too bright
const S = 'rgba(255, 255, 255, 0.42)';
const W = 1.8;
const BG = '#1a1a2e'; // App background color to mask background details

// ═══════════════════════════════════════════════════════════════
//  SPACE DOODLES
// ═══════════════════════════════════════════════════════════════

function Saturn({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale}) rotate(-18)`}>
      <Path d="M -36 -2 Q 0 -13 36 -2" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -24 -1 Q 0 -8 24 -1" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={0} cy={0} r={17} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M -13 -5 Q 0 -2 13 -5" fill="none" stroke={S} strokeWidth={W * 0.75} strokeLinecap="round" />
      <Path d="M -15 2 Q 0 5 15 2" fill="none" stroke={S} strokeWidth={W * 0.75} strokeLinecap="round" />
      <Path d="M -11 9 Q 0 12 11 9" fill="none" stroke={S} strokeWidth={W * 0.75} strokeLinecap="round" />
      <Path d="M -24 1 Q 0 8 24 1" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -36 2 Q 0 13 36 2" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function SaturnBig({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale}) rotate(-22)`}>
      <Path d="M -44 -3 Q 0 -16 44 -3" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -36 -2 Q 0 -13 36 -2" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path d="M -28 -1 Q 0 -9 28 -1" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Circle cx={0} cy={0} r={21} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M -16 -6 Q 0 -3 16 -6" fill="none" stroke={S} strokeWidth={W * 0.7} strokeLinecap="round" />
      <Path d="M -19 1 Q 0 4 19 1" fill="none" stroke={S} strokeWidth={W * 0.7} strokeLinecap="round" />
      <Path d="M -15 8 Q 0 11 15 8" fill="none" stroke={S} strokeWidth={W * 0.7} strokeLinecap="round" />
      <Path d="M -28 1 Q 0 9 28 1" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path d="M -36 2 Q 0 13 36 2" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path d="M -44 3 Q 0 16 44 3" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function Rocket({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale}) rotate(-35)`}>
      <Path d="M -4 18 Q -8 30 -2 36 Q 0 38 3 30 Q 8 36 4 18" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M -1 18 Q -3 27 0 31 Q 3 27 1 18" fill="none" stroke={S} strokeWidth={W * 0.7} strokeLinecap="round" />
      <Path d="M -9 4 Q -19 10 -19 22 Q -13 20 -9 15 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M 9 4 Q 19 10 19 22 Q 13 20 9 15 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M -5 15 L -7 18 L 7 18 L 5 15 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Path d="M -9 15 Q -11 0 -9 -15 Q -6 -28 0 -34 Q 6 -28 9 -15 Q 11 0 9 15 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M -9 -15 Q 0 -13 9 -15" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={0} cy={-1} r={4.5} fill={BG} stroke={S} strokeWidth={W} />
    </G>
  );
}

function Sparkle({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path
        d="M 0 -15 Q 2.5 -2.5 15 0 Q 2.5 2.5 0 15 Q -2.5 2.5 -15 0 Q -2.5 -2.5 0 -15 Z"
        fill="none"
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

function SmallStar({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path
        d="M 0 -10 L 2.5 -3 L 9 -2 L 4 3 L 5.5 9.5 L 0 6.5 L -5.5 9.5 L -4 3 L -9 -2 L -2.5 -3 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

function Moon({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path
        d="M 10 -16 C -6 -14 -8 10 8 16 C -2 11 -2 -9 10 -16 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

function UFO({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Line x1={-10} y1={5} x2={-16} y2={12} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={10} y1={5} x2={16} y2={12} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={0} y1={7} x2={0} y2={14} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -11 -1 C -11 -15 11 -15 11 -1" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={0} y1={-12} x2={0} y2={-20} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={0} cy={-22} r={2.5} fill={BG} stroke={S} strokeWidth={W} />
      <Ellipse cx={0} cy={2} rx={25} ry={7} fill={BG} stroke={S} strokeWidth={W} />
      <Circle cx={-14} cy={2} r={1.8} fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Circle cx={0} cy={3.5} r={1.8} fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Circle cx={14} cy={2} r={1.8} fill="none" stroke={S} strokeWidth={W * 0.8} />
    </G>
  );
}

function Telescope({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Line x1={0} y1={2} x2={-12} y2={25} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={0} y1={2} x2={12} y2={25} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={0} y1={2} x2={2} y2={25} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Circle cx={0} cy={1} r={2} fill={BG} stroke={S} strokeWidth={W} />
      <G transform="rotate(-35) translate(0, -5)">
        <Path d="M -6 -16 L -6 14 C -6 17 6 17 6 14 L 6 -16 C 6 -19 -6 -19 -6 -16 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
        <Path d="M -6 -10 Q 0 -9 6 -10" fill="none" stroke={S} strokeWidth={W * 0.8} />
        <Path d="M -3 15 L -2 21 L 2 21 L 3 15 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
        <Path d="M -11 -6 L -11 4" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
        <Line x1="-6" y1="-3" x2="-11" y2="-3" stroke={S} strokeWidth={W * 0.8} />
        <Line x1="-6" y1="2" x2="-11" y2="2" stroke={S} strokeWidth={W * 0.8} />
      </G>
    </G>
  );
}

function Astronaut({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -14 14 C -12 22 12 22 14 14" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -8 18 C -6 24 6 24 8 18" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Circle cx={0} cy={0} r={16} fill={BG} stroke={S} strokeWidth={W} />
      <Path
        d="M -11 -4 C -11 -10 -7 -12 0 -12 C 7 -12 11 -10 11 -4 C 11 2 7 4 0 4 C -7 4 -11 2 -11 -4 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M 4 -1 L 7 -4" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
    </G>
  );
}

function Alien({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -4 -22 Q -8 -29 -7 -30" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={-7} cy={-31} r={1.8} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M 4 -22 Q 8 -29 7 -30" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={7} cy={-31} r={1.8} fill={BG} stroke={S} strokeWidth={W} />
      <Path
        d="M 0 -22 C -11 -22 -11 -10 -8 -6 C -5 -2 5 -2 8 -6 C 11 -10 11 -22 0 -22 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M -7 -15 C -9 -12 -5 -9 -4 -12 C -3 -15 -5 -16 -7 -15 Z" fill="#FFFFFF" stroke={S} strokeWidth={W * 0.5} />
      <Path d="M 7 -15 C 9 -12 5 -9 4 -12 C 3 -15 5 -16 7 -15 Z" fill="#FFFFFF" stroke={S} strokeWidth={W * 0.5} />
      <Path d="M 0 -3 L 0 12" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 0 0 C 4 0, 8 -4, 11 -9" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 11 -9 L 14 -12 M 11 -9 L 15 -8 M 11 -9 L 13 -6" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path d="M 0 2 C -4 4, -7 8, -9 13" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 0 12 L -5 23" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 0 12 L 5 23" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function AsteriskStar({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Line x1={-6} y1={0} x2={6} y2={0} stroke={S} strokeWidth={W * 0.9} strokeLinecap="round" />
      <Line x1={0} y1={-6} x2={0} y2={6} stroke={S} strokeWidth={W * 0.9} strokeLinecap="round" />
      <Line x1={-4} y1={-4} x2={4} y2={4} stroke={S} strokeWidth={W * 0.65} strokeLinecap="round" />
      <Line x1={-4} y1={4} x2={4} y2={-4} stroke={S} strokeWidth={W * 0.65} strokeLinecap="round" />
    </G>
  );
}

function Constellation({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Line x1={0} y1={0} x2={14} y2={-16} stroke={S} strokeWidth={W * 0.5} strokeLinecap="round" />
      <Line x1={14} y1={-16} x2={30} y2={-10} stroke={S} strokeWidth={W * 0.5} strokeLinecap="round" />
      <Line x1={30} y1={-10} x2={26} y2={10} stroke={S} strokeWidth={W * 0.5} strokeLinecap="round" />
      <Line x1={26} y1={10} x2={10} y2={14} stroke={S} strokeWidth={W * 0.5} strokeLinecap="round" />
      <Line x1={10} y1={14} x2={0} y2={0} stroke={S} strokeWidth={W * 0.5} strokeLinecap="round" />
      <Circle cx={0} cy={0} r={2.2} fill={S} />
      <Circle cx={14} cy={-16} r={2.2} fill={S} />
      <Circle cx={30} cy={-10} r={2.2} fill={S} />
      <Circle cx={26} cy={10} r={2.2} fill={S} />
      <Circle cx={10} cy={14} r={2.2} fill={S} />
    </G>
  );
}

function Comet({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale}) rotate(-15)`}>
      <Circle cx={0} cy={0} r={4.5} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M 4 -1 C 12 -4, 20 -4, 28 -2" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path d="M 3 2 C 10 3, 18 5, 26 8" fill="none" stroke={S} strokeWidth={W * 0.6} strokeLinecap="round" />
      <Path d="M 1 -3 C 8 -8, 16 -10, 24 -11" fill="none" stroke={S} strokeWidth={W * 0.6} strokeLinecap="round" />
    </G>
  );
}

function DotStar({ x, y, scale = 1 }: DoodleProps) {
  return <Circle cx={x} cy={y} r={2.2 * (scale || 1)} fill={S} />;
}

// ═══════════════════════════════════════════════════════════════
//  OCEAN DOODLES — inspired by reference image
// ═══════════════════════════════════════════════════════════════

function Submarine({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Line x1={-20} y1={1} x2={-25} y2={1} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -25 -6 C -27 -6 -27 -1 -25 -1 C -23 -1 -23 -6 -25 -6 Z" fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M -25 1 C -27 1 -27 6 -25 6 C -23 6 -23 1 -25 1 Z" fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M -15 -9 L -21 -14 L -18 -8 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Path d="M -15 11 L -21 16 L -18 10 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Ellipse cx={0} cy={1} rx={21} ry={13} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M 12 -9 C 17 -5 17 7 12 11" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={-6} cy={1} r={4} fill={BG} stroke={S} strokeWidth={W} />
      <Circle cx={6} cy={1} r={4} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M 0 -12 L 0 -22 L 5 -22" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M 2 -25 L 5 -22 L 2 -19" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

function Whale({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Path d="M 6 -11 Q 6 -19 2 -23" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path d="M 8 -11 Q 12 -18 15 -19" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path
        d="M -24 3 C -12 -11, 8 -12, 20 -5 C 26 -1, 26 7, 18 9 C 10 11, -8 10, -16 6 L -24 9 L -28 14 C -29 10, -29 6, -26 5 C -29 4, -29 0, -28 -4 L -24 3 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M -12 7 C -6 8, 3 8, 8 7" fill="none" stroke={S} strokeWidth={W * 0.85} strokeLinecap="round" />
      <Path d="M -9 4 C -4 5, 4 5, 8 4" fill="none" stroke={S} strokeWidth={W * 0.85} strokeLinecap="round" />
      <Path d="M 1 7 C -2 14, -8 14, -6 8 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M 14 0 Q 15 -2 16 0" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 19 4 Q 17 5 15 3" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function Jellyfish({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -9 2 Q -12 12 -8 22" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -3 1 Q -1 13 -4 24" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 3 1 Q 5 13 2 24" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 9 2 Q 6 12 10 22" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path
        d="M -13 0 C -13 -14, 13 -14, 13 0 C 9 2, 7 -1, 4 1 C 1 -1, -1 -1, -4 1 C -7 -1, -9 2, -13 0 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={-4} cy={-5} r={1} fill={S} />
      <Circle cx={4} cy={-5} r={1} fill={S} />
      <Path d="M -2 -2 Q 0 0 2 -2" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function Anchor({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Circle cx={0} cy={-20} r={4.5} fill={BG} stroke={S} strokeWidth={W} />
      <Line x1={-11} y1={-11} x2={11} y2={-11} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={-11} y1={-14} x2={-11} y2={-8} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={11} y1={-14} x2={11} y2={-8} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={0} y1={-15} x2={0} y2={10} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -18 -1 C -18 14, 18 14, 18 -1" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -18 -1 L -23 -3 L -17 -7 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M 18 -1 L 23 -3 L 17 -7 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M -2 10 L 0 13 L 2 10" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function Starfish({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path
        d="M 0 -16 C 2 -8, 8 -8, 14 -7 C 8 -2, 7 4, 10 12 C 3 8, -3 8, -10 12 C -7 4, -8 -2, -14 -7 C -8 -8, -2 -8, 0 -16 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={0} cy={-2} r={1} fill={S} />
      <Circle cx={-4} cy={-4} r={0.8} fill={S} />
      <Circle cx={4} cy={-4} r={0.8} fill={S} />
      <Circle cx={-3} cy={3} r={0.8} fill={S} />
      <Circle cx={3} cy={3} r={0.8} fill={S} />
    </G>
  );
}

function Crab({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -12 7 Q -18 10 -16 16" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -9 9 Q -14 13 -10 18" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -5 10 Q -8 15 -4 18" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 12 7 Q 18 10 16 16" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 9 9 Q 14 13 10 18" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 5 10 Q 8 15 4 18" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -10 0 C -15 -3 -15 -10 -10 -12" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -10 -12 C -15 -15 -15 -9 -10 -9" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -10 -12 C -7 -12 -7 -9 -10 -9" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 10 0 C 15 -3 15 -10 10 -12" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 10 -12 C 15 -15 15 -9 10 -9" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 10 -12 C 7 -12 7 -9 10 -9" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Ellipse cx={0} cy={4} rx={15} ry={10} fill={BG} stroke={S} strokeWidth={W} />
      <Line x1={-5} y1={-6} x2={-5} y2={-11} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={-5} cy={-12} r={2} fill={BG} stroke={S} strokeWidth={W} />
      <Line x1={5} y1={-6} x2={5} y2={-11} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={5} cy={-12} r={2} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M -4 4 Q 0 7 4 4" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function Seahorse({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Path d="M -4 -3 C -10 -4 -10 6 -4 7" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1="-4" y1="2" x2="-8" y2="2" stroke={S} strokeWidth={W * 0.8} />
      <Path
        d="M 1 -18 C -7 -18 -7 -10 -3 -7 C 0 -5 1 -2 0 1 C -3 5 -6 5 -3 9 C 0 13 -2 19 -6 19 C -9 19 -9 15 -6 15 C -4 15 -4 17 -6 17 C -7 17 -7 18 -6 18 C -2 18 2 11 0 7 C -2 4 -1 1 2 -2 C 6 -6 7 -13 3 -16 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M 3 -16 L 8 -17 L 8 -14 L 3 -14" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Path d="M -2 -5 C 1 -5 3 -7 2 -9" fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Path d="M -1 -2 C 2 -2 4 -4 3 -6" fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Path d="M -1 1 C 2 1 4 -1 3 -3" fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Circle cx={1} cy={-13} r={1.2} fill={S} />
    </G>
  );
}

function Lighthouse({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Path d="M -22 22 L 10 22 C 10 22 8 16 2 15 C -4 14 -3 10 -10 9 C -17 8 -22 13 -22 22 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Path d="M -24 22 C -20 25, -15 25, -12 22 C -8 25, -3 25, 0 22 C 3 25, 8 25, 12 22" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -9 9 L -6 -16 L 6 -16 L 9 9 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Line x1={-8} y1={1} x2={8} y2={1} stroke={S} strokeWidth={W} />
      <Line x1={-7} y1={-8} x2={7} y2={-8} stroke={S} strokeWidth={W} />
      <Rect x={-1.5} y={-4} width={3} height={4} fill={BG} stroke={S} strokeWidth={W * 0.8} />
      <Rect x={-1.5} y={5} width={3} height={4} fill={BG} stroke={S} strokeWidth={W * 0.8} />
      <Rect x={-8} y={-19} width={16} height={3} fill={BG} stroke={S} strokeWidth={W} />
      <Rect x={-5} y={-27} width={10} height={8} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M -5 -27 C -5 -33 5 -33 5 -27" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={0} y1={-27} x2={0} y2={-19} stroke={S} strokeWidth={W * 0.8} />
      <Path d="M 6 -24 L 20 -28 M 6 -22 L 22 -22 M 6 -20 L 20 -16" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
    </G>
  );
}

function Fish({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Path d="M -12 0 L -20 -6 L -17 0 L -20 6 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Path d="M -4 -5 C -2 -9 4 -9 4 -5" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path
        d="M -12 0 C -8 -7, 6 -7, 11 0 C 6 7, -8 7, -12 0 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M 3 -4 C 1 -2, 1 2, 3 4" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Circle cx={7} cy={-2} r={1} fill={S} />
      <Path d="M 10 1 Q 9 2 8 1" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function WaveLine({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -12 0 Q -6 -4 0 0 Q 6 4 12 0" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
    </G>
  );
}

function Bubble({ x, y, scale = 1 }: DoodleProps) {
  return <Circle cx={x} cy={y} r={3 * (scale || 1)} fill="none" stroke={S} strokeWidth={W * 0.7} />;
}

// ═══════════════════════════════════════════════════════════════
//  EGYPTIAN DOODLES — inspired by reference image
// ═══════════════════════════════════════════════════════════════

function Pyramids({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Background Left Pyramid */}
      <Path d="M -16 -2 L -28 14 L -8 14 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Line x1="-16" y1="-2" x2="-18" y2="14" stroke={S} strokeWidth={W} />
      <Line x1="-15" y1="2" x2="-14" y2="2" stroke={S} strokeWidth={W * 0.7} />
      <Line x1="-14" y1="6" x2="-12" y2="6" stroke={S} strokeWidth={W * 0.7} />
      <Line x1="-13" y1="10" x2="-10" y2="10" stroke={S} strokeWidth={W * 0.7} />

      {/* Background Right Pyramid */}
      <Path d="M 16 2 L 6 14 L 26 14 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Line x1="16" y1="2" x2="18" y2="14" stroke={S} strokeWidth={W} />

      {/* Main Foreground Pyramid */}
      <Path d="M 0 -14 L -18 14 L 16 14 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Line x1={0} y1={-14} x2={2} y2={14} stroke={S} strokeWidth={W} />
      <Line x1={0.5} y1={-8} x2={4.5} y2={-8} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={1} y1={-4} x2={7.5} y2={-4} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={1.5} y1={0} x2={10.5} y2={0} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={2} y1={4} x2={12.5} y2={4} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={2} y1={8} x2={14.5} y2={8} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={2} y1={12} x2={15.5} y2={12} stroke={S} strokeWidth={W * 0.7} />
    </G>
  );
}

function Ankh({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path
        d="M 0 -5 C -6 -5 -7 -17 0 -17 C 7 -17 6 -5 0 -5 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 0 -8 C -3 -8 -4 -14 0 -14 C 4 -14 3 -8 0 -8 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W * 0.8}
        strokeLinecap="round"
      />
      <Path
        d="M -11 -5 C -11 -5 -11 -1 -11 -1 L -3 -1 L -3 15 C -3 17 3 17 3 15 L 3 -1 L 11 -1 C 11 -1 11 -5 11 -5 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={0} cy={-3} r={1.5} fill={S} />
    </G>
  );
}

function Scarab({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -9 -8 C -15 -12, -16 -18, -11 -20" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -12 1 C -18 1, -19 6, -15 11" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -10 9 C -16 13, -16 19, -11 21" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 9 -8 C 15 -12, 16 -18, 11 -20" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 12 1 C 18 1, 19 6, 15 11" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 10 9 C 16 13, 16 19, 11 21" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Rect x={-11} y={-14} width={22} height={28} rx={11} fill={BG} stroke={S} strokeWidth={W} />
      <Path d="M -11 -3 C -5 -5, 5 -5, 11 -3" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={0} y1={-3} x2={0} y2={14} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -7 2 Q -4 1 -1 3" fill="none" stroke={S} strokeWidth={W * 0.75} strokeLinecap="round" />
      <Path d="M 7 2 Q 4 1 1 3" fill="none" stroke={S} strokeWidth={W * 0.75} strokeLinecap="round" />
      <Path d="M -8 7 Q -4 6 -1 8" fill="none" stroke={S} strokeWidth={W * 0.75} strokeLinecap="round" />
      <Path d="M 8 7 Q 4 6 1 8" fill="none" stroke={S} strokeWidth={W * 0.75} strokeLinecap="round" />
      <Path d="M -6 -14 C -6 -19, 6 -19, 6 -14 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -3 -19 Q -5 -23 -1 -22" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 3 -19 Q 5 -23 1 -22" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function EyeOfHorus({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Path d="M -15 -11 C -6 -16, 6 -16, 15 -11" fill="none" stroke={S} strokeWidth={W * 1.5} strokeLinecap="round" />
      <Path d="M -16 -4 C -8 -9, 8 -9, 16 -4" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -16 -4 C -8 2, 8 2, 16 -4" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Circle cx={0} cy={-3.5} r={3.5} fill={BG} stroke={S} strokeWidth={W} />
      <Circle cx={0} cy={-3.5} r={1.5} fill={S} />
      <Path d="M -4 -2 L -4 10 Q -4 13 -6 13" fill="none" stroke={S} strokeWidth={W * 1.2} strokeLinecap="round" />
      <Path d="M 6 -3 C 8 4, 2 8, -2 8 C -6 8, -6 4, -4 3 C -2 2, -1 4, -2 5" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function Tutankhamun({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path
        d="M -16 -2 C -16 -15, -11 -20, 0 -20 C 11 -20, 16 -15, 16 -2 L 13 13 L 9 13 L 9 4 L -9 4 L -9 13 L -13 13 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={-14} y1={-9} x2={-6} y2={-6} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={-10} y1={-15} x2={-4} y2={-10} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={-12} y1={2} x2={-9} y2={2} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={-12} y1={8} x2={-9} y2={8} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={14} y1={-9} x2={6} y2={-6} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={10} y1={-15} x2={4} y2={-10} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={12} y1={2} x2={9} y2={2} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={12} y1={8} x2={9} y2={8} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path d="M -6 -10 C -6 -10 -7 -3 -5 -1 C -3 1, 3 1, 5 -1 C 7 -3, 6 -10, 6 -10 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Circle cx={-2.5} cy={-5.5} r={0.8} fill={S} />
      <Circle cx={2.5} cy={-5.5} r={0.8} fill={S} />
      <Path d="M -2.5 -3 Q 0 -2 2.5 -3" fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Path d="M -1 -20 C -1 -23, 1 -23, 1 -20 Z" fill={BG} stroke={S} strokeWidth={W * 0.8} />
      <Path d="M -2.5 1 L -3.5 10 L 3.5 10 L 2.5 1 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Line x1={-3} y1={4} x2={3} y2={4} stroke={S} strokeWidth={W * 0.8} />
      <Line x1={-3} y1={7} x2={3} y2={7} stroke={S} strokeWidth={W * 0.8} />
    </G>
  );
}

function Cleopatra({ x, y, scale = 1, flip }: DoodleProps) {
  const f = flip ? -1 : 1;
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale * f}, ${scale})`}>
      <Path
        d="M 5 -18 C -1 -18 -10 -15 -12 -5 C -13 4 -12 12 -12 15 L -6 15 C -6 11 -7 5 -5 1 L -2 -3 C 0 -6 3 -7 5 -7 C 8 -7 11 -2 12 1 C 12 6, 10 11, 10 15 L 15 15 C 15 11, 17 0, 14 -8 C 12 -14, 9 -18, 5 -18 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Line x1={-9} y1={-8} x2={-9} y2={10} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={-5} y1={-3} x2={-5} y2={6} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Line x1={11} y1={-3} x2={11} y2={10} stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" />
      <Path
        d="M -2 -14 C -6 -14 -6 -10 -6 -8 C -6 -6 -9 -5 -9 -3 C -9 -1 -6 -1 -6 2 C -6 5 -3 7 1 7 C 5 7, 7 4, 7 0"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path d="M -3 -6 C -4 -5, -4 -3, -3 -2" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Line x1={-3} y1={-4} x2={-1} y2={-4} stroke={S} strokeWidth={W} />
      <Path d="M -11 15 C -5 20, 5 20, 11 15" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -13 18 C -5 24, 5 24, 13 18" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" />
    </G>
  );
}

function Lotus({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Line x1={0} y1={2} x2={0} y2={22} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path
        d="M -14 -3 C -11 -13, -4 -16, 0 -7 C 4 -16, 11 -13, 14 -3 C 8 4, -8 4, -14 -3 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path d="M 0 -7 C -3 -16, 3 -16, 0 -7 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Path d="M -7 -3 Q -2 -11 0 -7" fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Path d="M 7 -3 Q 2 -11 0 -7" fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Path d="M -6 2 C -3 5, 3 5, 6 2 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
    </G>
  );
}

function Urn({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -10 -4 C -16 -4 -16 8 -10 8" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M 10 -4 C 16 -4 16 8 10 8" fill={BG} stroke={S} strokeWidth={W} strokeLinecap="round" />
      <Path d="M -5 -14 L 5 -14 L 6 -10 L -6 -10 Z" fill={BG} stroke={S} strokeWidth={W} strokeLinejoin="round" />
      <Path
        d="M -4 -10 L 4 -10 L 10 2 C 12 8, 10 16, 0 17 C -10 16, -12 8, -10 2 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
      />
      <Path d="M -8 -2 C -4 -4, 4 -4, 8 -2" fill="none" stroke={S} strokeWidth={W * 0.85} strokeLinecap="round" />
      <Path d="M -10 4 C -5 2, 5 2, 10 4" fill="none" stroke={S} strokeWidth={W * 0.85} strokeLinecap="round" />
      <Path d="M -9 10 C -4 8, 4 8, 9 10" fill="none" stroke={S} strokeWidth={W * 0.85} strokeLinecap="round" />
    </G>
  );
}

function WingedSun({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path
        d="M -32 -2 C -20 -10 -10 -4 0 -4 C 10 -4 20 -10 32 -2 C 28 8 10 6 0 4 C -10 6 -28 8 -32 -2 Z"
        fill={BG}
        stroke={S}
        strokeWidth={W}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path d="M -30 1 Q -15 -2 0 1 Q 15 -2 30 1" fill="none" stroke={S} strokeWidth={W * 0.8} />
      <Line x1={-25} y1={-2} x2={-22} y2={3} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={-18} y1={-3} x2={-15} y2={3} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={-10} y1={-4} x2={-8} y2={3} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={10} y1={-4} x2={8} y2={3} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={18} y1={-3} x2={15} y2={3} stroke={S} strokeWidth={W * 0.7} />
      <Line x1={25} y1={-2} x2={22} y2={3} stroke={S} strokeWidth={W * 0.7} />
      <Circle cx={0} cy={0} r={7.5} fill={BG} stroke={S} strokeWidth={W} />
      <Circle cx={0} cy={0} r={4.5} fill={BG} stroke={S} strokeWidth={W * 0.8} />
    </G>
  );
}

function Hieroglyphs({ x, y, scale = 1 }: DoodleProps) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Path d="M -8 0 L -5 -3 L -2 0 L 1 -3 L 4 0 L 7 -3 L 9 0" fill="none" stroke={S} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M -8 5 L -5 2 L -2 5 L 1 2 L 4 5 L 7 2 L 9 5" fill="none" stroke={S} strokeWidth={W * 0.8} strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

function SandyDot({ x, y, scale = 1 }: DoodleProps) {
  return <Circle cx={x} cy={y} r={2 * (scale || 1)} fill={S} />;
}

// ═══════════════════════════════════════════════════════════════
//  TILE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

const TILE_HEIGHT = 800;

type TileEntry = {
  C: React.ComponentType<DoodleProps>;
  rx: number;
  ry: number;
  s: number;
  f?: boolean;
};

// SPACE THEME
const SPACE_TILE: TileEntry[] = [
  { C: SaturnBig,     rx: 0.12, ry: 0.05, s: 1.6 },
  { C: Sparkle,       rx: 0.88, ry: 0.08, s: 1.3 },
  { C: Rocket,        rx: 0.85, ry: 0.14, s: 1.5, f: true },
  { C: SmallStar,     rx: 0.15, ry: 0.17, s: 1.3 },
  { C: Moon,          rx: 0.08, ry: 0.23, s: 1.5 },
  { C: UFO,           rx: 0.86, ry: 0.28, s: 1.5 },
  { C: Saturn,        rx: 0.15, ry: 0.35, s: 1.5 },
  { C: AsteriskStar,  rx: 0.88, ry: 0.38, s: 1.3 },
  { C: Rocket,        rx: 0.86, ry: 0.44, s: 1.5 },
  { C: Telescope,     rx: 0.10, ry: 0.50, s: 1.5 },
  { C: Comet,         rx: 0.84, ry: 0.56, s: 1.4, f: true },
  { C: SaturnBig,     rx: 0.85, ry: 0.65, s: 1.6 },
  { C: Sparkle,       rx: 0.12, ry: 0.68, s: 1.2 },
  { C: Astronaut,     rx: 0.14, ry: 0.74, s: 1.4 },
  { C: UFO,           rx: 0.86, ry: 0.80, s: 1.5 },
  { C: Constellation, rx: 0.08, ry: 0.86, s: 1.3 },
  { C: Saturn,        rx: 0.82, ry: 0.92, s: 1.5 },
  { C: Alien,         rx: 0.14, ry: 0.96, s: 1.4 },
];

const DOT_STARS = [
  { rx: 0.04, ry: 0.06, s: 0.8 }, { rx: 0.42, ry: 0.08, s: 0.6 }, { rx: 0.55, ry: 0.05, s: 0.7 },
  { rx: 0.95, ry: 0.07, s: 0.5 }, { rx: 0.20, ry: 0.15, s: 0.6 }, { rx: 0.48, ry: 0.16, s: 0.8 },
  { rx: 0.65, ry: 0.14, s: 0.5 }, { rx: 0.38, ry: 0.24, s: 0.7 }, { rx: 0.55, ry: 0.26, s: 0.6 },
  { rx: 0.95, ry: 0.25, s: 0.8 }, { rx: 0.42, ry: 0.33, s: 0.5 }, { rx: 0.60, ry: 0.35, s: 0.7 },
  { rx: 0.03, ry: 0.34, s: 0.6 }, { rx: 0.50, ry: 0.42, s: 0.8 }, { rx: 0.22, ry: 0.44, s: 0.5 },
  { rx: 0.68, ry: 0.43, s: 0.6 }, { rx: 0.04, ry: 0.52, s: 0.7 }, { rx: 0.46, ry: 0.53, s: 0.6 },
  { rx: 0.58, ry: 0.51, s: 0.8 }, { rx: 0.95, ry: 0.55, s: 0.5 }, { rx: 0.40, ry: 0.60, s: 0.7 },
  { rx: 0.52, ry: 0.63, s: 0.6 }, { rx: 0.04, ry: 0.62, s: 0.8 }, { rx: 0.48, ry: 0.70, s: 0.5 },
  { rx: 0.56, ry: 0.72, s: 0.7 }, { rx: 0.02, ry: 0.71, s: 0.6 }, { rx: 0.42, ry: 0.80, s: 0.8 },
  { rx: 0.95, ry: 0.81, s: 0.6 }, { rx: 0.55, ry: 0.79, s: 0.5 }, { rx: 0.20, ry: 0.90, s: 0.7 },
  { rx: 0.50, ry: 0.88, s: 0.6 }, { rx: 0.65, ry: 0.95, s: 0.8 }, { rx: 0.96, ry: 0.94, s: 0.5 }
];

// OCEAN THEME
const OCEAN_TILE: TileEntry[] = [
  { C: Lighthouse,     rx: 0.14, ry: 0.03, s: 1.5 },
  { C: WaveLine,       rx: 0.38, ry: 0.01, s: 1.2 },
  { C: Starfish,       rx: 0.58, ry: 0.03, s: 1.3 },
  { C: Submarine,      rx: 0.85, ry: 0.04, s: 1.5, f: true },
  { C: Whale,          rx: 0.22, ry: 0.12, s: 1.5 },
  { C: Jellyfish,      rx: 0.06, ry: 0.11, s: 1.4 },
  { C: Anchor,         rx: 0.78, ry: 0.09, s: 1.4 },
  { C: Fish,           rx: 0.92, ry: 0.12, s: 1.3 },
  { C: WaveLine,       rx: 0.48, ry: 0.14, s: 1.1 },
  { C: Crab,           rx: 0.09, ry: 0.21, s: 1.4 },
  { C: Seahorse,       rx: 0.32, ry: 0.20, s: 1.4 },
  { C: Starfish,       rx: 0.60, ry: 0.19, s: 1.2 },
  { C: Whale,          rx: 0.84, ry: 0.22, s: 1.4, f: true },
  { C: Submarine,      rx: 0.16, ry: 0.30, s: 1.5 },
  { C: WaveLine,       rx: 0.04, ry: 0.32, s: 1.2 },
  { C: Jellyfish,      rx: 0.72, ry: 0.28, s: 1.4 },
  { C: Fish,           rx: 0.90, ry: 0.31, s: 1.3, f: true },
  { C: Crab,           rx: 0.44, ry: 0.30, s: 1.3 },
  { C: Anchor,         rx: 0.08, ry: 0.39, s: 1.4 },
  { C: Seahorse,       rx: 0.28, ry: 0.38, s: 1.4, f: true },
  { C: Lighthouse,     rx: 0.82, ry: 0.40, s: 1.5 },
  { C: Starfish,       rx: 0.64, ry: 0.42, s: 1.2 },
  { C: Whale,          rx: 0.12, ry: 0.49, s: 1.5 },
  { C: WaveLine,       rx: 0.35, ry: 0.48, s: 1.3 },
  { C: Crab,           rx: 0.72, ry: 0.49, s: 1.4 },
  { C: Seahorse,       rx: 0.90, ry: 0.51, s: 1.3 },
  { C: Jellyfish,      rx: 0.08, ry: 0.60, s: 1.4 },
  { C: Submarine,      rx: 0.28, ry: 0.59, s: 1.4 },
  { C: Anchor,         rx: 0.66, ry: 0.58, s: 1.4 },
  { C: Fish,           rx: 0.86, ry: 0.61, s: 1.3 },
  { C: WaveLine,       rx: 0.46, ry: 0.60, s: 1.2 },
  { C: Lighthouse,     rx: 0.18, ry: 0.69, s: 1.5, f: true },
  { C: Starfish,       rx: 0.40, ry: 0.68, s: 1.2 },
  { C: Whale,          rx: 0.84, ry: 0.70, s: 1.5 },
  { C: Seahorse,       rx: 0.62, ry: 0.71, s: 1.4, f: true },
  { C: Crab,           rx: 0.22, ry: 0.79, s: 1.4 },
  { C: Jellyfish,      rx: 0.06, ry: 0.81, s: 1.4 },
  { C: Submarine,      rx: 0.74, ry: 0.80, s: 1.5, f: true },
  { C: Fish,           rx: 0.90, ry: 0.81, s: 1.3 },
  { C: Anchor,         rx: 0.12, ry: 0.90, s: 1.4 },
  { C: Seahorse,       rx: 0.34, ry: 0.89, s: 1.3 },
  { C: WaveLine,       rx: 0.60, ry: 0.91, s: 1.2 },
  { C: Crab,           rx: 0.84, ry: 0.90, s: 1.4 },
  { C: Starfish,       rx: 0.08, ry: 0.97, s: 1.3 },
  { C: Fish,           rx: 0.30, ry: 0.98, s: 1.2, f: true },
  { C: Lighthouse,     rx: 0.70, ry: 0.96, s: 1.4 },
  { C: Jellyfish,      rx: 0.92, ry: 0.98, s: 1.4 },
];

const OCEAN_BUBBLES = [
  { rx: 0.05, ry: 0.06, s: 0.8 }, { rx: 0.40, ry: 0.08, s: 0.5 }, { rx: 0.52, ry: 0.04, s: 0.7 },
  { rx: 0.92, ry: 0.06, s: 0.6 }, { rx: 0.22, ry: 0.14, s: 0.7 }, { rx: 0.46, ry: 0.16, s: 0.8 },
  { rx: 0.62, ry: 0.13, s: 0.5 }, { rx: 0.36, ry: 0.23, s: 0.6 }, { rx: 0.54, ry: 0.25, s: 0.7 },
  { rx: 0.94, ry: 0.24, s: 0.8 }, { rx: 0.40, ry: 0.32, s: 0.5 }, { rx: 0.58, ry: 0.34, s: 0.6 },
  { rx: 0.04, ry: 0.33, s: 0.8 }, { rx: 0.48, ry: 0.41, s: 0.7 }, { rx: 0.24, ry: 0.43, s: 0.5 },
  { rx: 0.66, ry: 0.42, s: 0.6 }, { rx: 0.03, ry: 0.51, s: 0.7 }, { rx: 0.44, ry: 0.52, s: 0.6 },
  { rx: 0.56, ry: 0.50, s: 0.8 }, { rx: 0.94, ry: 0.54, s: 0.5 }, { rx: 0.38, ry: 0.59, s: 0.7 },
  { rx: 0.50, ry: 0.62, s: 0.5 }, { rx: 0.03, ry: 0.61, s: 0.8 }, { rx: 0.46, ry: 0.69, s: 0.6 },
  { rx: 0.54, ry: 0.71, s: 0.7 }, { rx: 0.02, ry: 0.70, s: 0.5 }, { rx: 0.40, ry: 0.79, s: 0.8 },
  { rx: 0.94, ry: 0.80, s: 0.6 }, { rx: 0.52, ry: 0.78, s: 0.5 }, { rx: 0.18, ry: 0.89, s: 0.7 },
  { rx: 0.48, ry: 0.87, s: 0.6 }, { rx: 0.62, ry: 0.94, s: 0.8 }, { rx: 0.94, ry: 0.93, s: 0.5 }
];

// EGYPTIANS THEME
const EGYPTIANS_TILE: TileEntry[] = [
  { C: Pyramids,       rx: 0.12, ry: 0.03, s: 1.5 },
  { C: Hieroglyphs,    rx: 0.38, ry: 0.01, s: 1.2 },
  { C: Ankh,           rx: 0.58, ry: 0.03, s: 1.3 },
  { C: Cleopatra,      rx: 0.85, ry: 0.04, s: 1.4, f: true },
  { C: Tutankhamun,    rx: 0.26, ry: 0.12, s: 1.4 },
  { C: Scarab,         rx: 0.06, ry: 0.11, s: 1.3 },
  { C: EyeOfHorus,     rx: 0.76, ry: 0.10, s: 1.4 },
  { C: Lotus,          rx: 0.92, ry: 0.12, s: 1.3 },
  { C: Hieroglyphs,    rx: 0.48, ry: 0.14, s: 1.1 },
  { C: Urn,            rx: 0.08, ry: 0.21, s: 1.3 },
  { C: WingedSun,      rx: 0.32, ry: 0.20, s: 1.4 },
  { C: Ankh,           rx: 0.60, ry: 0.19, s: 1.3 },
  { C: Pyramids,       rx: 0.84, ry: 0.22, s: 1.5 },
  { C: Cleopatra,      rx: 0.16, ry: 0.30, s: 1.4 },
  { C: Hieroglyphs,    rx: 0.04, ry: 0.32, s: 1.2 },
  { C: Tutankhamun,    rx: 0.72, ry: 0.28, s: 1.4 },
  { C: Scarab,         rx: 0.90, ry: 0.31, s: 1.3, f: true },
  { C: Urn,            rx: 0.44, ry: 0.30, s: 1.3 },
  { C: EyeOfHorus,     rx: 0.08, ry: 0.39, s: 1.4 },
  { C: Lotus,          rx: 0.28, ry: 0.38, s: 1.3 },
  { C: WingedSun,      rx: 0.82, ry: 0.40, s: 1.4 },
  { C: Ankh,           rx: 0.64, ry: 0.42, s: 1.3 },
  { C: Pyramids,       rx: 0.12, ry: 0.49, s: 1.5 },
  { C: Hieroglyphs,    rx: 0.35, ry: 0.48, s: 1.3 },
  { C: Tutankhamun,    rx: 0.72, ry: 0.49, s: 1.4 },
  { C: Cleopatra,      rx: 0.90, ry: 0.51, s: 1.4 },
  { C: Scarab,         rx: 0.08, ry: 0.60, s: 1.3 },
  { C: EyeOfHorus,     rx: 0.28, ry: 0.59, s: 1.4 },
  { C: Lotus,          rx: 0.66, ry: 0.58, s: 1.3 },
  { C: Urn,            rx: 0.86, ry: 0.61, s: 1.3 },
  { C: Hieroglyphs,    rx: 0.46, ry: 0.60, s: 1.2 },
  { C: WingedSun,      rx: 0.18, ry: 0.69, s: 1.4 },
  { C: Ankh,           rx: 0.40, ry: 0.68, s: 1.3 },
  { C: Pyramids,       rx: 0.84, ry: 0.70, s: 1.5 },
  { C: Tutankhamun,    rx: 0.62, ry: 0.71, s: 1.4 },
  { C: Cleopatra,      rx: 0.22, ry: 0.79, s: 1.4, f: true },
  { C: Scarab,         rx: 0.06, ry: 0.81, s: 1.3 },
  { C: Urn,            rx: 0.74, ry: 0.80, s: 1.3 },
  { C: EyeOfHorus,     rx: 0.90, ry: 0.81, s: 1.4 },
  { C: Lotus,          rx: 0.12, ry: 0.90, s: 1.3 },
  { C: WingedSun,      rx: 0.34, ry: 0.89, s: 1.4 },
  { C: Hieroglyphs,    rx: 0.60, ry: 0.91, s: 1.2 },
  { C: Pyramids,       rx: 0.84, ry: 0.90, s: 1.5 },
  { C: Ankh,           rx: 0.08, ry: 0.97, s: 1.3 },
  { C: Tutankhamun,    rx: 0.30, ry: 0.98, s: 1.4 },
  { C: Cleopatra,      rx: 0.70, ry: 0.96, s: 1.4 },
  { C: Scarab,         rx: 0.92, ry: 0.98, s: 1.3 },
];

const EGYPTIAN_DOTS = [
  { rx: 0.04, ry: 0.06, s: 0.8 }, { rx: 0.42, ry: 0.08, s: 0.6 }, { rx: 0.55, ry: 0.05, s: 0.7 },
  { rx: 0.95, ry: 0.07, s: 0.5 }, { rx: 0.20, ry: 0.15, s: 0.6 }, { rx: 0.48, ry: 0.16, s: 0.8 },
  { rx: 0.65, ry: 0.14, s: 0.5 }, { rx: 0.38, ry: 0.24, s: 0.7 }, { rx: 0.55, ry: 0.26, s: 0.6 },
  { rx: 0.95, ry: 0.25, s: 0.8 }, { rx: 0.42, ry: 0.33, s: 0.5 }, { rx: 0.60, ry: 0.35, s: 0.7 },
  { rx: 0.03, ry: 0.34, s: 0.6 }, { rx: 0.50, ry: 0.42, s: 0.8 }, { rx: 0.22, ry: 0.44, s: 0.5 },
  { rx: 0.68, ry: 0.43, s: 0.6 }, { rx: 0.04, ry: 0.52, s: 0.7 }, { rx: 0.46, ry: 0.53, s: 0.6 },
  { rx: 0.58, ry: 0.51, s: 0.8 }, { rx: 0.95, ry: 0.55, s: 0.5 }, { rx: 0.30, ry: 0.60, s: 0.7 },
  { rx: 0.52, ry: 0.63, s: 0.6 }, { rx: 0.04, ry: 0.62, s: 0.8 }, { rx: 0.48, ry: 0.70, s: 0.5 },
  { rx: 0.56, ry: 0.72, s: 0.7 }, { rx: 0.02, ry: 0.71, s: 0.6 }, { rx: 0.42, ry: 0.80, s: 0.8 },
  { rx: 0.95, ry: 0.81, s: 0.6 }, { rx: 0.55, ry: 0.79, s: 0.5 }, { rx: 0.20, ry: 0.90, s: 0.7 },
  { rx: 0.50, ry: 0.88, s: 0.6 }, { rx: 0.65, ry: 0.95, s: 0.8 }, { rx: 0.96, ry: 0.94, s: 0.5 }
];

const TILE_MAP: Record<ThemeName, TileEntry[]> = {
  space: SPACE_TILE,
  egyptians: EGYPTIANS_TILE,
  ocean: OCEAN_TILE,
};

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function RoadsideDoodles({
  theme,
  milestonePoints,
  totalHeight,
  svgWidth,
  centerX,
}: RoadsideDoodlesProps) {
  const tile = TILE_MAP[theme];
  if (!tile) return null;

  const numTiles = Math.ceil(totalHeight / TILE_HEIGHT) + 1;
  
  const backgroundElements: React.ReactElement[] = [];
  const foregroundElements: React.ReactElement[] = [];

  const allPts = [
    { x: centerX, y: totalHeight - 120 },
    ...milestonePoints,
    { x: centerX, y: 70 },
  ];

  function getRoadCenterX(y: number): number {
    if (y >= allPts[0].y) return centerX;
    if (y <= allPts[allPts.length - 1].y) return centerX;
    for (let i = 0; i < allPts.length - 1; i++) {
      const p1 = allPts[i];
      const p2 = allPts[i + 1];
      if (y <= p1.y && y >= p2.y) {
        const t = (p1.y - y) / (p1.y - p2.y);
        return p1.x + (p2.x - p1.x) * t;
      }
    }
    return centerX;
  }

  const ROAD_HALF = 70;

  for (let t = 0; t < numTiles; t++) {
    const offsetY = t * TILE_HEIGHT;

    // Foreground main doodles
    for (let d = 0; d < tile.length; d++) {
      const entry = tile[d];
      const dx = entry.rx * svgWidth;
      const dy = offsetY + entry.ry * TILE_HEIGHT;

      if (dy > totalHeight + 40 || dy < -40) continue;

      const roadX = getRoadCenterX(dy);
      if (Math.abs(dx - roadX) < ROAD_HALF) continue;

      foregroundElements.push(
        <entry.C
          key={`t${t}-d${d}`}
          x={dx}
          y={dy}
          scale={entry.s}
          flip={entry.f}
        />
      );
    }

    // Background fine details
    if (theme === 'space') {
      for (let s = 0; s < DOT_STARS.length; s++) {
        const star = DOT_STARS[s];
        const sx = star.rx * svgWidth;
        const sy = offsetY + star.ry * TILE_HEIGHT;
        if (sy > totalHeight + 10 || sy < -10) continue;
        const roadX = getRoadCenterX(sy);
        if (Math.abs(sx - roadX) < 42) continue;
        backgroundElements.push(
          <DotStar key={`t${t}-s${s}`} x={sx} y={sy} scale={star.s} />
        );
      }
    } else if (theme === 'ocean') {
      for (let b = 0; b < OCEAN_BUBBLES.length; b++) {
        const bubble = OCEAN_BUBBLES[b];
        const bx = bubble.rx * svgWidth;
        const by = offsetY + bubble.ry * TILE_HEIGHT;
        if (by > totalHeight + 10 || by < -10) continue;
        const roadX = getRoadCenterX(by);
        if (Math.abs(bx - roadX) < 42) continue;
        backgroundElements.push(
          <Bubble key={`t${t}-b${b}`} x={bx} y={by} scale={bubble.s} />
        );
      }
    } else if (theme === 'egyptians') {
      for (let d = 0; d < EGYPTIAN_DOTS.length; d++) {
        const dot = EGYPTIAN_DOTS[d];
        const dx = dot.rx * svgWidth;
        const dy = offsetY + dot.ry * TILE_HEIGHT;
        if (dy > totalHeight + 10 || dy < -10) continue;
        const roadX = getRoadCenterX(dy);
        if (Math.abs(dx - roadX) < 42) continue;
        backgroundElements.push(
          <SandyDot key={`t${t}-d${d}`} x={dx} y={dy} scale={dot.s} />
        );
      }
    }
  }

  return (
    <G>
      {backgroundElements}
      {foregroundElements}
    </G>
  );
}
