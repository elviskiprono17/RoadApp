import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  BackHandler,
  ScrollView,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Question data ─────────────────────────────────────────
interface QuestionOption {
  emoji: string;
  label: string;
  value: string;
}

interface Question {
  id: 'goalFocus' | 'trackingPreference' | 'biggestChallenge' | 'reminderFrequency';
  icon: string;
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: 'goalFocus',
    icon: '🎯',
    title: "What's your primary goal focus?",
    subtitle: 'This helps us tailor your roadmap experience to what matters most to you.',
    options: [
      { emoji: '💰', label: 'Financial', value: 'financial' },
      { emoji: '🏋️', label: 'Fitness', value: 'fitness' },
      { emoji: '📚', label: 'Learning', value: 'learning' },
      { emoji: '💼', label: 'Career', value: 'career' },
      { emoji: '🎯', label: 'Other', value: 'other' },
    ],
  },
  {
    id: 'trackingPreference',
    icon: '📊',
    title: 'How do you prefer to track progress?',
    subtitle: "We'll customize your dashboard to match your style.",
    options: [
      { emoji: '📊', label: 'Numbers & metrics', value: 'metrics' },
      { emoji: '✅', label: 'Milestone checkpoints', value: 'milestones' },
      { emoji: '📅', label: 'Daily habits', value: 'habits' },
    ],
  },
  {
    id: 'biggestChallenge',
    icon: '🧗',
    title: "What's your biggest challenge with goals?",
    subtitle: "Understanding your struggles lets us support you where it counts.",
    options: [
      { emoji: '🚀', label: 'Getting started', value: 'starting' },
      { emoji: '📈', label: 'Staying consistent', value: 'consistency' },
      { emoji: '🏁', label: 'Finishing strong', value: 'finishing' },
      { emoji: '🤷', label: 'Not sure', value: 'unsure' },
    ],
  },
  {
    id: 'reminderFrequency',
    icon: '🔔',
    title: 'How often do you want reminders?',
    subtitle: "We'll send you motivational nudges to keep you on track.",
    options: [
      { emoji: '🔔', label: 'Daily', value: 'daily' },
      { emoji: '📆', label: 'Weekly', value: 'weekly' },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────
export default function QuestionsScreen() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;

  // Per-question entrance anims
  const questionFade = useRef(new Animated.Value(1)).current;
  const questionSlide = useRef(new Animated.Value(0)).current;

  // Button pulse for when selection is made
  const buttonScale = useRef(new Animated.Value(1)).current;

  // ── Disable hardware back button ──
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  // ── Entrance animation ──
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Pulse button when selection changes ──
  useEffect(() => {
    const currentQuestion = QUESTIONS[currentStep];
    if (answers[currentQuestion.id]) {
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [answers, currentStep]);

  // ── Select an option ──
  function handleSelect(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // ── Animate to next question ──
  function animateToNext(nextStep: number) {
    // Slide out current question
    Animated.parallel([
      Animated.timing(questionFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(questionSlide, {
        toValue: -SCREEN_WIDTH * 0.3,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);

      // Reset position for incoming question
      questionSlide.setValue(SCREEN_WIDTH * 0.3);
      questionFade.setValue(0);

      // Slide in new question
      Animated.parallel([
        Animated.timing(questionFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(questionSlide, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  // ── Handle next / continue ──
  async function handleNext() {
    const currentQuestion = QUESTIONS[currentStep];
    if (!answers[currentQuestion.id]) return;

    if (currentStep < QUESTIONS.length - 1) {
      animateToNext(currentStep + 1);
    } else {
      // Last step — save answers and navigate
      try {
        await AsyncStorage.setItem('onboarding_answers', JSON.stringify(answers));
      } catch {
        // Silently continue even if storage fails
      }
      router.replace('/(onboarding)/trial' as Href);
    }
  }

  // ── Current question ──
  const question = QUESTIONS[currentStep];
  const hasSelection = !!answers[question.id];
  const isLastStep = currentStep === QUESTIONS.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.inner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: contentSlide }],
          },
        ]}
      >
        {/* ── Progress dots ── */}
        <View style={styles.progressRow}>
          {QUESTIONS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= currentStep ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* ── Question label ── */}
        <Text style={styles.stepLabel}>
          Question {currentStep + 1} of {QUESTIONS.length}
        </Text>

        {/* ── Animated question content ── */}
        <Animated.View
          style={[
            styles.questionContent,
            {
              opacity: questionFade,
              transform: [{ translateX: questionSlide }],
            },
          ]}
        >
          {/* Large emoji icon */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconGlow} />
            <Text style={styles.questionIcon}>{question.icon}</Text>
          </View>

          {/* Title & subtitle */}
          <Text style={styles.questionTitle}>{question.title}</Text>
          <Text style={styles.questionSubtitle}>{question.subtitle}</Text>

          {/* Option cards */}
          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelect(question.id, option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedCheck}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Next / Continue button ── */}
        <Animated.View
          style={[
            styles.buttonWrapper,
            { transform: [{ scale: buttonScale }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.nextButton,
              !hasSelection && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!hasSelection}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.nextButtonText,
                !hasSelection && styles.nextButtonTextDisabled,
              ]}
            >
              {isLastStep ? 'Continue' : 'Next'}
            </Text>
            {!isLastStep && (
              <Text
                style={[
                  styles.nextButtonArrow,
                  !hasSelection && styles.nextButtonTextDisabled,
                ]}
              >
                →
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#F5C518',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  // Step label
  stepLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 28,
  },

  // Question content
  questionContent: {
    flex: 1,
  },

  // Icon
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,197,24,0.1)',
    top: -4,
  },
  questionIcon: {
    fontSize: 52,
  },

  // Title & subtitle
  questionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 10,
    lineHeight: 32,
  },
  questionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
    marginBottom: 28,
  },

  // Options
  optionsScroll: {
    flex: 1,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionCardSelected: {
    borderColor: '#F5C518',
    backgroundColor: 'rgba(245,197,24,0.06)',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a2e',
  },

  // Button
  buttonWrapper: {
    paddingTop: 16,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#F5C518',
    borderRadius: 16,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(245,197,24,0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.3,
  },
  nextButtonTextDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },
  nextButtonArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    marginLeft: 8,
  },
});
