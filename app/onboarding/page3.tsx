import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function OnboardingPage3() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const iconScale = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const floatingAnimation = useSharedValue(0);
  const sparkleAnimation = useSharedValue(0);

  useEffect(() => {
    // Icon animations
    iconScale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Text animations
    opacity.value = withDelay(600, withSpring(1));
    translateY.value = withDelay(600, withSpring(0));
    
    // Button animation
    buttonOpacity.value = withDelay(1200, withSpring(1));
    
    // Floating animation
    floatingAnimation.value = withDelay(800, 
      withRepeat(
        withSequence(
          withSpring(-10, { damping: 15, stiffness: 100 }),
          withSpring(10, { damping: 15, stiffness: 100 })
        ),
        -1,
        true
      )
    );
    
    // Sparkle animation
    sparkleAnimation.value = withDelay(1000,
      withRepeat(
        withSequence(
          withSpring(1, { damping: 10, stiffness: 200 }),
          withSpring(0.5, { damping: 10, stiffness: 200 })
        ),
        -1,
        true
      )
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { translateY: floatingAnimation.value },
    ],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      sparkleAnimation.value,
      [0.5, 1],
      [0.8, 1.2],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ scale }],
      opacity: sparkleAnimation.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleNext = () => {
    router.push('/onboarding/page4');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.sparkle, styles.sparkle1, sparkleAnimatedStyle]}>
            <Ionicons name="star" size={20} color="#ffffff" />
          </Animated.View>
          <Animated.View style={[styles.sparkle, styles.sparkle2, sparkleAnimatedStyle]}>
            <Ionicons name="star" size={16} color="#ffffff" />
          </Animated.View>
          <Animated.View style={[styles.sparkle, styles.sparkle3, sparkleAnimatedStyle]}>
            <Ionicons name="star" size={12} color="#ffffff" />
          </Animated.View>
          
          <Animated.View style={[styles.iconBackground, iconAnimatedStyle]}>
            <Ionicons name="card" size={80} color="#ffffff" />
          </Animated.View>
        </View>

        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.title}>Easy Payments</Text>
          <Text style={styles.subtitle}>
            Settle debts instantly with integrated payment options. No more awkward reminders or IOUs.
          </Text>
        </Animated.View>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#4facfe" />
          </Pressable>
          
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#4facfe" />
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 60,
    position: 'relative',
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 1,
  },
  sparkle1: {
    top: -10,
    right: 10,
  },
  sparkle2: {
    bottom: 0,
    left: -5,
  },
  sparkle3: {
    top: 20,
    left: -15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 80,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 60,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 30,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4facfe',
    marginRight: 8,
  },
});
