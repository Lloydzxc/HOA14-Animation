import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  BounceIn,
  ZoomIn,
  Layout,
  RotateInDownLeft,
  FlipInEasyX,
} from 'react-native-reanimated';

interface Goal {
  id: number;
  text: string;
  completed: boolean;
}

export default function App() {
  const [goalText, setGoalText] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // Animation values
  const buttonScale = useSharedValue(1);
  const inputShake = useSharedValue(0);

  const addGoal = () => {
    if (goalText.trim()) {
      setGoals([...goals, { id: Date.now(), text: goalText, completed: false }]);
      setGoalText('');
      
      // Animate button press with spring
      buttonScale.value = withSequence(
        withSpring(0.85, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    } else {
      // Shake animation for empty input
      inputShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  };

  const removeGoal = (id: number) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  const toggleGoal = (id: number) => {
    setGoals(
      goals.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  // Button animation style
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Input shake animation
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShake.value }],
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Goals 🎯</Text>
        <Text style={styles.subtitle}>{goals.length} goals</Text>
      </View>

      <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
        <TextInput
          style={styles.input}
          placeholder="Enter your goal..."
          placeholderTextColor="#999"
          value={goalText}
          onChangeText={setGoalText}
          onSubmitEditing={addGoal}
        />
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity style={styles.addButton} onPress={addGoal}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <ScrollView
        style={styles.goalsContainer}
        showsVerticalScrollIndicator={false}
      >
        {goals.map((goal, index) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            index={index}
            onToggle={toggleGoal}
            onRemove={removeGoal}
          />
        ))}
      </ScrollView>

      {goals.length === 0 && (
        <Animated.View
          entering={FadeIn.delay(300).duration(600)}
          style={styles.emptyState}
        >
          <Text style={styles.emptyText}>No goals yet!</Text>
          <Text style={styles.emptySubtext}>Start adding some 🚀</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

interface GoalItemProps {
  goal: Goal;
  index: number;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}

function GoalItem({ goal, index, onToggle, onRemove }: GoalItemProps) {
  // Animation values
  const progress = useSharedValue(goal.completed ? 100 : 0);
  const scale = useSharedValue(1);
  const checkboxScale = useSharedValue(goal.completed ? 1 : 0);

  // Different entrance animations based on index
  const getEnteringAnimation = () => {
    const animations = [
      SlideInRight.springify().damping(15).stiffness(100),
      BounceIn.delay(index * 50),
      ZoomIn.delay(index * 50).springify(),
      RotateInDownLeft.delay(index * 50),
      FlipInEasyX.delay(index * 50),
    ];
    return animations[index % animations.length];
  };

  const handleToggle = () => {
    // Animate progress bar
    progress.value = withSpring(goal.completed ? 0 : 100, {
      damping: 20,
      stiffness: 100,
    });

    // Animate checkbox
    checkboxScale.value = withSequence(
      withSpring(goal.completed ? 0 : 1.3),
      withSpring(goal.completed ? 0 : 1)
    );

    // Scale animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );

    onToggle(goal.id);
  };

  const handleRemove = () => {
    scale.value = withTiming(0.8, { duration: 200 }, () => {
      runOnJS(onRemove)(goal.id);
    });
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(
      scale.value,
      [0.8, 1],
      [0.5, 1],
      Extrapolate.CLAMP
    ),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
    opacity: checkboxScale.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 100],
      [1, 0.5],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <Animated.View
      entering={getEnteringAnimation()}
      exiting={SlideOutLeft.duration(300)}
      layout={Layout.springify().damping(15).stiffness(100)}
      style={[styles.goalItem, containerStyle]}
    >
      {/* Progress bar background */}
      <Animated.View style={[styles.progressBar, progressStyle]} />

      {/* Content */}
      <TouchableOpacity
        onPress={handleToggle}
        style={styles.goalContent}
        activeOpacity={0.7}
      >
        <View style={styles.checkbox}>
          <Animated.Text style={[styles.checkmark, checkmarkStyle]}>
            ✓
          </Animated.Text>
        </View>
        <Animated.Text style={[styles.goalText, textStyle]}>
          {goal.text}
        </Animated.Text>
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity
        onPress={handleRemove}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  goalsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#e0e7ff',
  },
  goalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#6366f1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkmark: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    zIndex: 1,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 18,
    color: '#bbb',
  },
});