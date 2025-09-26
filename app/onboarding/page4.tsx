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
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function OnboardingPage4() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const iconScale = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const celebrationAnimation = useSharedValue(0);
  const confettiAnimation = useSharedValue(0);

  useEffect(() => {
    // Icon animations
    iconScale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Text animations
    opacity.value = withDelay(600, withSpring(1));
    translateY.value = withDelay(600, withSpring(0));
    
    // Button animation
    buttonOpacity.value = withDelay(1000, withSpring(1));
    buttonScale.value = withDelay(1000, withSpring(1, { damping: 10, stiffness: 150 }));
    
    // Celebration animation
    celebrationAnimation.value = withDelay(1200,
      withRepeat(
        withSequence(
          withSpring(1, { damping: 8, stiffness: 200 }),
          withSpring(0.95, { damping: 8, stiffness: 200 })
        ),
        -1,
        true
      )
    );
    
    // Confetti animation
    confettiAnimation.value = withDelay(1400,
      withRepeat(
        withSequence(
          withSpring(1, { damping: 15, stiffness: 100 }),
          withSpring(0, { damping: 15, stiffness: 100 })
        ),
        -1,
        true
      )
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const celebration = interpolate(
      celebrationAnimation.value,
      [0.95, 1],
      [0.98, 1.05],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ scale: iconScale.value * celebration }],
    };
  });

  const confettiAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      confettiAnimation.value,
      [0, 1],
      [0, -30],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ translateY }],
      opacity: confettiAnimation.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleGetStarted = () => {
    router.push('/login');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#a8edea', '#fed6e3']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {/* Confetti elements */}
          <Animated.View style={[styles.confetti, styles.confetti1, confettiAnimatedStyle]}>
            <Ionicons name="diamond" size={16} color="#ff6b6b" />
          </Animated.View>
          <Animated.View style={[styles.confetti, styles.confetti2, confettiAnimatedStyle]}>
            <Ionicons name="heart" size={14} color="#4ecdc4" />
          </Animated.View>
          <Animated.View style={[styles.confetti, styles.confetti3, confettiAnimatedStyle]}>
            <Ionicons name="star" size={18} color="#45b7d1" />
          </Animated.View>
          <Animated.View style={[styles.confetti, styles.confetti4, confettiAnimatedStyle]}>
            <Ionicons name="triangle" size={12} color="#f9ca24" />
          </Animated.View>
          
          <Animated.View style={[styles.iconBackground, iconAnimatedStyle]}>
            <Ionicons name="checkmark-circle" size={80} color="#ffffff" />
          </Animated.View>
        </View>

        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.title}>You're All Set!</Text>
          <Text style={styles.subtitle}>
            Ready to start splitting expenses and managing your money with friends? Let's get started!
          </Text>
        </Animated.View>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#a8edea" />
          </Pressable>
          
          <Pressable style={styles.getStartedButton} onPress={handleGetStarted}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.gradientButton}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
              <Ionicons name="rocket" size={20} color="#ffffff" />
            </LinearGradient>
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
  confetti: {
    position: 'absolute',
    zIndex: 1,
  },
  confetti1: {
    top: -20,
    right: 20,
  },
  confetti2: {
    bottom: 10,
    left: -10,
  },
  confetti3: {
    top: 10,
    left: -25,
  },
  confetti4: {
    top: -10,
    right: -15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#34495e',
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
    backgroundColor: 'rgba(52, 73, 94, 0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#2c3e50',
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
  getStartedButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 25,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 10,
  },
});
