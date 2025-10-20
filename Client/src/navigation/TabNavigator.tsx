import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

import { HomeScreen } from '../screens/home';
import { GroupsScreen } from '../screens/groups';
import { FriendsScreen } from '../screens/friends';
import { ProfileScreen } from '../screens/profile';

const Tab = createBottomTabNavigator();

const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  let iconName: keyof typeof Ionicons.glyphMap;

  switch (routeName) {
    case 'Home':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Groups':
      iconName = focused ? 'people' : 'people-outline';
      break;
    case 'Friends':
      iconName = focused ? 'person-add' : 'person-add-outline';
      break;
    case 'Profile':
      iconName = focused ? 'settings' : 'settings-outline';
      break;
    default:
      iconName = 'ellipse';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -2,
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopWidth: 0.5,
          borderTopColor: colors.border.light,
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
          shadowColor: colors.gray[900],
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.text.tertiary,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;