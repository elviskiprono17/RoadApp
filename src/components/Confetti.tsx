import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COUNT = 180;

const CONFETTI_COLORS = [
  '#F5C518', // gold
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#45B7D1', // sky blue
  '#96E6A1', // mint
  '#FF8A65', // orange
  '#BA68C8', // purple
  '#FFD54F', // yellow
  '#E1BEE7', // lavender
  '#FFFFFF', // white
  '#2563EB', // blue
];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'strip';
  type: 'left-cannon' | 'right-cannon' | 'rain';
}

interface Props {
  visible: boolean;
  onComplete?: () => void;
}

export default function Confetti({ visible, onComplete }: Props) {
  const pieces = useRef<ConfettiPiece[]>([]);

  // Create pieces on first render
  if (pieces.current.length === 0) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const shapes = ['square', 'circle', 'strip'] as const;
      let type: 'left-cannon' | 'right-cannon' | 'rain';
      if (i < 65) {
        type = 'left-cannon';
      } else if (i < 130) {
        type = 'right-cannon';
      } else {
        type = 'rain';
      }

      pieces.current.push({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        rotate: new Animated.Value(0),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 7 + Math.random() * 9,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        type,
      });
    }
  }

  useEffect(() => {
    if (!visible) return;

    // Reset all pieces
    pieces.current.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.rotate.setValue(0);
      p.scale.setValue(0);
      p.opacity.setValue(1);
    });

    // Animate each piece
    const animations = pieces.current.map((piece) => {
      const delay = Math.random() * 500;
      const duration = 2500 + Math.random() * 2000;
      const spinCount = 3 + Math.random() * 8;

      let startX: number;
      let startY: number;
      let endX: number;
      let peakY: number;
      let endY: number;

      if (piece.type === 'left-cannon') {
        startX = -20;
        startY = SCREEN_HEIGHT * 0.75;
        // burst to the right across the screen
        endX = startX + SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.7;
        peakY = startY - (SCREEN_HEIGHT * 0.25 + Math.random() * SCREEN_HEIGHT * 0.45);
        endY = SCREEN_HEIGHT + 50;
      } else if (piece.type === 'right-cannon') {
        startX = SCREEN_WIDTH + 20;
        startY = SCREEN_HEIGHT * 0.75;
        // burst to the left across the screen
        endX = startX - (SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.7);
        peakY = startY - (SCREEN_HEIGHT * 0.25 + Math.random() * SCREEN_HEIGHT * 0.45);
        endY = SCREEN_HEIGHT + 50;
      } else {
        // rain falling from top
        startX = Math.random() * SCREEN_WIDTH;
        startY = -50;
        endX = startX + (Math.random() - 0.5) * 120;
        peakY = startY;
        endY = SCREEN_HEIGHT + 50;
      }

      piece.x.setValue(startX);
      piece.y.setValue(startY);

      const isRain = piece.type === 'rain';

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Horizontal movement
          Animated.timing(piece.x, {
            toValue: endX,
            duration,
            useNativeDriver: true,
          }),
          // Vertical movement (burst then fall vs simple fall)
          isRain
            ? Animated.timing(piece.y, {
                toValue: endY,
                duration,
                easing: Easing.linear,
                useNativeDriver: true,
              })
            : Animated.sequence([
                // Burst phase up to peak
                Animated.timing(piece.y, {
                  toValue: peakY,
                  duration: duration * 0.35,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                // Gravity fall phase
                Animated.timing(piece.y, {
                  toValue: endY,
                  duration: duration * 0.65,
                  easing: Easing.linear,
                  useNativeDriver: true,
                }),
              ]),
          // Rotation / Spin
          Animated.timing(piece.rotate, {
            toValue: spinCount,
            duration,
            useNativeDriver: true,
          }),
          // Scale pop
          Animated.spring(piece.scale, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
          // Fade out near the bottom
          Animated.sequence([
            Animated.delay(duration * 0.8),
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.current.map((piece, i) => {
        const spin = piece.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        const isStrip = piece.shape === 'strip';
        const isCircle = piece.shape === 'circle';

        return (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              {
                width: isStrip ? piece.size * 0.45 : piece.size,
                height: isStrip ? piece.size * 2.8 : piece.size,
                borderRadius: isCircle ? piece.size / 2 : isStrip ? 2 : 2,
                backgroundColor: piece.color,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate: spin },
                  { scale: piece.scale },
                ],
                opacity: piece.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
  piece: {
    position: 'absolute',
    top: 0,
  },
});
