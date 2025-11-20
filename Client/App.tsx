import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeApiUrl } from './src/config/api';

// Disable console logs in production
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
}

export default function App() {
  useEffect(() => {
    // Initialize API URL on app start
    initializeApiUrl().catch(console.error);
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar 
        style="light" 
        backgroundColor="#1E293B"
        translucent={Platform.OS === 'android'}
      />
    </>
  );
}
