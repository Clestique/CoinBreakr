import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupsScreen, CreateGroupScreen, GroupExpensesScreen, GroupSettingsScreen } from '../screens/groups';

const Stack = createStackNavigator();

const GroupsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="GroupsList" component={GroupsScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupExpenses" component={GroupExpensesScreen} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} />
    </Stack.Navigator>
  );
};

export default GroupsStackNavigator;