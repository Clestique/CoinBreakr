import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function OnboardingPage2() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const iconRotate = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    // Icon animations
    iconScale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 200 }));
    iconRotate.value = withDelay(500, withSpring(360, { damping: 20, stiffness: 100 }));
    
    // Text animations
    opacity.value = withDelay(700, withSpring(1));
    translateY.value = withDelay(700, withSpring(0));
    
    // Button animation
    buttonOpacity.value = withDelay(1300, withSpring(1));
    
    // Pulse animation for icon
    pulseAnimation.value = withDelay(1000, withSpring(1, { damping: 8, stiffness: 100 }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const pulse = interpolate(
      pulseAnimation.value,
      [0, 1],
      [1, 1.1],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { scale: iconScale.value * pulse },
        { rotate: `${iconRotate.value}deg` },
      ],
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
    router.push('/onboarding/page3');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={['#f093fb', '#f5576c']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View style={styles.iconBackground}>
            <Ionicons name="people" size={80} color="#ffffff" />
          </View>
        </Animated.View>

        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.title}>Track Groups</Text>
          <Text style={styles.subtitle}>
            Create groups for trips, roommates, or any shared expenses. Keep everyone in the loop.
          </Text>
        </Animated.View>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#f093fb" />
          </Pressable>
          
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#f093fb" />
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
    color: '#f093fb',
    marginRight: 8,
  },
});
