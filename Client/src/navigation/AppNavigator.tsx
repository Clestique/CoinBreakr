import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet } from 'react-native';

import { OnboardingScreen1, OnboardingScreen2, OnboardingScreen3, OnboardingScreen4 } from '../screens/onboarding';
import { AuthScreen } from '../screens/profile';
import { AddFriendScreen, ReviewFriendsScreen, AddExpenseScreen, ExpenseDetailScreen } from '../screens/friends';
import { CreateGroupScreen } from '../screens/groups';
import TabNavigator from './TabNavigator';
import colors from '../theme/colors';

const Stack = createStackNavigator();

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>💰</Text>
    <Text style={styles.loadingTitle}>CoinBreakr</Text>
  </View>
);

const AppNavigator: React.FC = () => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setIsFirstTime(hasSeenOnboarding === null);
    } catch (error) {
      console.error('Error checking first time user:', error);
      setIsFirstTime(true);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  if (isFirstTime === null) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isFirstTime ? "Onboarding1" : "Auth"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
        <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
        <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
        <Stack.Screen 
          name="Onboarding4" 
          component={OnboardingScreen4}
          listeners={{
            beforeRemove: () => {
              markOnboardingComplete();
            },
          }}
        />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="AddFriend" component={AddFriendScreen} />
        <Stack.Screen name="ReviewFriends" component={ReviewFriendsScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.body,
  },
  loadingText: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
});

export default AppNavigator;
