import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, StatusBar, Animated, RefreshControl } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { friendsService, Friend, PendingFriend } from '../../services/friends';

// Constants for consistent sizing across all screens
const TAB_BAR_HEIGHT = 65; // From TabNavigator configuration

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingFriends, setPendingFriends] = useState<PendingFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [fabAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    checkInitialState();
  }, []);

  // Handle navigation params and refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const params = route.params as any;
      if (params?.refresh) {
        loadFriends(false); // Don't show refresh spinner for navigation refresh
        // Clear the refresh parameter to prevent repeated refreshes
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params])
  );

  const checkInitialState = async () => {
    try {
      await loadFriends();
    } catch (error) {
      console.error('Error checking initial state:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      const response = await friendsService.getFriends();
      setFriends(response.friends || []);
      setPendingFriends(response.pendingFriends || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Unable to load friends. Please check your connection and try again.');
      setFriends([]);
      setPendingFriends([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    loadFriends(true);
  };

  const navigateToAddFriend = () => {
    setShowFabOptions(false);
    navigation.navigate('AddFriend');
  };

  const handleAddExpense = () => {
    setShowFabOptions(false);
    // Navigate to add expense screen without pre-selected friend
    navigation.navigate('AddExpense');
  };

  const toggleFabOptions = () => {
    const toValue = showFabOptions ? 0 : 1;
    setShowFabOptions(!showFabOptions);

    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeFabOptions = () => {
    if (showFabOptions) {
      setShowFabOptions(false);
      Animated.spring(fabAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  // No filtering needed since we removed search functionality

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  const totalFriends = friends.length + pendingFriends.length;
  const hasAnyFriends = totalFriends > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background.body} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top - 15 }]}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={navigateToAddFriend}
        >
          <Ionicons name="person-add-outline" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScrollBeginDrag={closeFabOptions}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {hasAnyFriends ? (
            <>
              {/* Friends List */}
              {friends.map((friend, index) => (
                <TouchableOpacity
                  key={`friend-${friend._id || index}`}
                  style={styles.friendItem}
                  onPress={() => {
                    closeFabOptions();
                    navigation.navigate('FriendExpense', { friend });
                  }}
                >
                  <Image
                    source={{ uri: friend.profileImage || 'https://placehold.co/40x40' }}
                    style={styles.friendAvatar}
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendEmail}>{friend.email}</Text>
                    {friend.hasTransactions && (
                      <Text style={styles.transactionBadge}>Has transactions</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}

              {/* Pending Friends */}
              {pendingFriends.map((pendingFriend, index) => (
                <View key={`pending-${pendingFriend._id || `idx-${index}`}`} style={styles.friendItem}>
                  <Image
                    source={{ uri: pendingFriend.profileImage || 'https://placehold.co/40x40' }}
                    style={styles.friendAvatar}
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{pendingFriend.name}</Text>
                    <Text style={styles.friendEmail}>{pendingFriend.email || 'No email'}</Text>
                    <Text style={styles.pendingBadge}>Pending invitation</Text>
                  </View>
                </View>
              ))}

              {/* Add New Friend Button */}
              <View style={styles.addNewFriendContainer}>
                <TouchableOpacity
                  style={styles.addNewFriendButton}
                  onPress={navigateToAddFriend}
                >
                  <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.addNewFriendText}>Add new friend</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Empty State */
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptyText}>
                Add friends to start splitting expenses and sharing costs
              </Text>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowText}>Tap the + button to get started</Text>
                <Text style={styles.arrow}>↘️</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Invisible overlay to close FAB when tapping outside */}
      {showFabOptions && (
        <TouchableOpacity
          style={styles.invisibleOverlay}
          onPress={closeFabOptions}
          activeOpacity={1}
        />
      )}

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        {/* FAB Options */}
        {showFabOptions && (
          <Animated.View
            style={[
              styles.fabOptions,
              {
                opacity: fabAnimation,
                transform: [
                  {
                    translateY: fabAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.fabOptionContainer}>
              <Text style={styles.fabOptionLabel}>Add Friend</Text>
              <TouchableOpacity
                style={styles.fabOption}
                onPress={navigateToAddFriend}
              >
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {hasAnyFriends && (
              <View style={styles.fabOptionContainer}>
                <Text style={styles.fabOptionLabel}>Add Expense</Text>
                <TouchableOpacity
                  style={styles.fabOption}
                  onPress={handleAddExpense}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {/* Main FAB */}
        <TouchableOpacity
          style={styles.fabButton}
          onPress={toggleFabOptions}
        >
          <Ionicons
            name={showFabOptions ? "close" : "add"}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingBottom: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.background.body,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    marginBottom: -13
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: TAB_BAR_HEIGHT + 80, // Tab bar height + FAB space
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: colors.background.tertiary,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  transactionBadge: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  pendingBadge: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  addNewFriendContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  addNewFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addNewFriendText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  arrowContainer: {
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 8,
    textAlign: 'center',
  },
  arrow: {
    fontSize: 24,
    marginRight: -60,
    marginTop: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT, // Properly positioned above tab bar
    right: 24,
    alignItems: 'flex-end', // Align everything to the right
    zIndex: 1000, // Ensure FAB is above overlay
  },
  fabOptions: {
    marginBottom: 16,
    alignItems: 'flex-end', // Align options to the right
  },
  fabOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'flex-end', // Ensure content aligns to the right
  },
  fabOptionLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fabOption: {
    width: 56, // Same width as main FAB for perfect alignment
    height: 56, // Same height as main FAB for perfect alignment
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  invisibleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },

});

export default FriendsScreen;
