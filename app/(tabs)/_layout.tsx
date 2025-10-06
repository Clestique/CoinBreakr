import { Tabs } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate, 
  Extrapolation,
  withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = useMemo(() => (state.routes.length > 0 ? containerWidth / state.routes.length : 0), [containerWidth, state.routes.length]);
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, { 
      damping: 20, 
      stiffness: 150 
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingBottom: insets.bottom,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
      }}
      onLayout={onLayout}
    >
      {/* Top indicator line */}
      <View style={{ position: 'relative', height: 3 }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              height: 3,
              width: tabWidth,
              backgroundColor: '#667eea',
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
            },
            indicatorStyle,
          ]}
        />
      </View>
      
      <View style={{ flexDirection: 'row', paddingTop: 4, paddingHorizontal: 8 }}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName = route.name === 'index' ? 'home' : route.name === 'friends' ? 'people' : route.name === 'groups' ? 'albums' : 'person';
          const label = descriptors[route.key]?.options?.title ?? route.name;

          // Individual tab animations
          const iconScale = useSharedValue(1);
          const labelOpacity = useSharedValue(0.6);

          useEffect(() => {
            if (isFocused) {
              iconScale.value = withSpring(1.1, { damping: 15, stiffness: 200 });
              labelOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
            } else {
              iconScale.value = withSpring(1, { damping: 15, stiffness: 200 });
              labelOpacity.value = withSpring(0.6, { damping: 15, stiffness: 200 });
            }
          }, [isFocused]);

          const iconAnimatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: iconScale.value }],
          }));

          const labelAnimatedStyle = useAnimatedStyle(() => ({
            opacity: labelOpacity.value,
          }));

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'center',
                paddingVertical: 4,
                paddingBottom: 6,
              }}
            >
              <Animated.View style={iconAnimatedStyle}>
                <Ionicons 
                  name={iconName as any} 
                  size={22} 
                  color={isFocused ? '#667eea' : '#999999'} 
                />
              </Animated.View>
              
              <Animated.Text
                style={[
                  {
                    marginTop: 2,
                    fontSize: 10,
                    fontWeight: isFocused ? '600' : '500',
                    color: isFocused ? '#667eea' : '#999999',
                  },
                  labelAnimatedStyle
                ]}
              >
                {label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}