import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { FriendsScreen, FriendExpenseScreen, FriendDetailsScreen, ExpenseDetailScreen, AddExpenseScreen } from '../screens/friends';

const Stack = createStackNavigator();

const FriendsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="FriendsList" component={FriendsScreen} />
      <Stack.Screen name="FriendExpense" component={FriendExpenseScreen} />
      <Stack.Screen name="FriendDetails" component={FriendDetailsScreen} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
    </Stack.Navigator>
  );
};

export default FriendsStackNavigator;