import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar 
        style="dark" 
        backgroundColor="#F8FAFC"
        translucent={Platform.OS === 'android'}
      />
    </>
  );
}
