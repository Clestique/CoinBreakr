import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';
import { friendsService, Friend, PendingFriend } from '../../services/friends';

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingFriends, setPendingFriends] = useState<PendingFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasContactPermission, setHasContactPermission] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkInitialState();
  }, []);

  // Add focus listener to refresh friends when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFriends();
    });

    return unsubscribe;
  }, [navigation]);

  const checkInitialState = async () => {
    try {
      // Check if user has contact permission
      const hasPermission = await friendsService.checkContactPermission();
      setHasContactPermission(hasPermission);

      // Load friends
      await loadFriends();

      // If first time and no permission, request it
      if (!hasPermission && isFirstTime) {
        requestContactPermission();
      }
    } catch (error) {
      console.error('Error checking initial state:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await friendsService.getFriends();

      if (response.success && response.data) {
        setFriends(response.data.friends || []);
        setPendingFriends(response.data.pendingFriends || []);
      } else {
        setFriends([]);
        setPendingFriends([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Unable to load friends. Please check your connection and try again.');
      setFriends([]);
      setPendingFriends([]);
    }
  };

  const requestContactPermission = async () => {
    try {
      const granted = await friendsService.requestContactPermission();
      setHasContactPermission(granted);

      if (!granted) {
        Alert.alert(
          'Contact Access',
          'Contact access helps you find friends who are already using CoinBreakr.',
          [{ text: 'OK' }]
        );
      }
      setIsFirstTime(false);
    } catch (error) {
      console.error('Error requesting contact permission:', error);
    }
  };

  const navigateToAddFriend = () => {
    navigation.navigate('AddFriend');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background.body} barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top - 14 }]}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons
            name={unreadCount > 0 ? "notifications" : "notifications-outline"}
            size={24}
            color={colors.text.secondary}
          />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Permission Button */}
        {!hasContactPermission && showAddFriend && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestContactPermission}
          >
            <Text style={styles.permissionButtonText}>Allow Contact Access</Text>
            <Text style={styles.permissionSubtext}>Find friends who are already using CoinBreakr</Text>
          </TouchableOpacity>
        )}

        {/* Friends List */}
        <SectionCard title={`My Friends${friends.length + pendingFriends.length > 0 ? ` (${friends.length + pendingFriends.length})` : ''}`}>
          {/* Search Bar inside Friends section */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setShowAddFriend(true)}
            />
          </View>

          {friends.length > 0 || pendingFriends.length > 0 ? (
            <View style={styles.friendsList}>
              {friends.map((friend, index) => (
                <TouchableOpacity
                  key={`friend-${friend.id || friend._id || index}`}
                  style={styles.friendItem}
                  onPress={() => {
                    // Friend details functionality removed
                    console.log('Friend selected:', friend.name);
                  }}
                >
                  <Image
                    source={{ uri: friend.profileImage || 'https://placehold.co/40x40' }}
                    style={styles.friendAvatar}
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendEmail}>{friend.email}</Text>
                    <View style={styles.badgeContainer}>
                      {friend.hasTransactions && (
                        <Text style={styles.transactionBadge}>Has transactions</Text>
                      )}
                      {!friend.isContactSynced && (
                        <Text style={styles.nonAppUserBadge}>Not on CoinBreakr</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}
              {pendingFriends.map((pendingFriend, index) => (
                <View key={`pending-${pendingFriend.id || `idx-${index}`}`} style={styles.friendItem}>
                  <Image
                    source={{ uri: pendingFriend.profileImage || 'https://placehold.co/40x40' }}
                    style={styles.friendAvatar}
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{pendingFriend.name}</Text>
                    <Text style={styles.friendEmail}>{pendingFriend.email || 'No email'}</Text>
                    <View style={styles.badgeContainer}>
                      <Text style={styles.pendingBadge}>Pending invitation</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptyText}>
                Add friends to start splitting expenses and sharing costs
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddFriend(true)}
              >
                <Text style={styles.addButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* Only show How to Connect if no friends and no pending friends */}
        {friends.length === 0 && pendingFriends.length === 0 && (
          <SectionCard title="How to Connect">
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔍</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Search & Add</Text>
                  <Text style={styles.featureText}>Find friends by email or phone number</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💸</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Split Expenses</Text>
                  <Text style={styles.featureText}>Easily divide costs for meals, trips, and more</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚖️</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Track Balances</Text>
                  <Text style={styles.featureText}>Keep track of who owes what and settle up</Text>
                </View>
              </View>
            </View>
          </SectionCard>
        )}
      </ScrollView>

      {/* Floating Add Expense Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={navigateToAddFriend}
      >
        <Ionicons name="person-add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.body,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  permissionButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  permissionSubtext: {
    color: colors.primary[100],
    fontSize: 14,
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    borderRadius: 8,
    marginVertical: 2,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colors.background.tertiary,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  transactionBadge: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  nonAppUserBadge: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  pendingBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary[600],
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  fabButton: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[600],
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },

});

export default FriendsScreen;