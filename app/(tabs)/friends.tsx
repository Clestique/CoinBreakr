import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FriendsService, Friend } from '../../googleServices/friendsService';
import AddFriendModal from '../../components/AddFriendModal';

const { width, height } = Dimensions.get('window');

interface FriendWithBalance extends Friend {
  balance?: number;
  balanceMessage?: string;
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<FriendWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const searchBarOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadFriends();
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    searchBarOpacity.value = withDelay(400, withSpring(1));
    contentOpacity.value = withDelay(600, withSpring(1));
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsWithBalances = await FriendsService.getFriendsWithBalances();
      setFriends(friendsWithBalances);
    } catch (error) {
      console.error('Load friends error:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  }, []);

  const handleFriendAdded = useCallback(() => {
    loadFriends(); // Refresh the friends list
  }, []);

  const handleFriendPress = (friend: FriendWithBalance) => {
    router.push({
      pathname: '/friend-expenses',
      params: {
        friendId: friend._id,
        friendName: friend.name,
      },
    });
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendsService.removeFriend(friendId);
              await loadFriends(); // Refresh the list
              Alert.alert('Success', `${friendName} has been removed from your friends.`);
            } catch (error) {
              console.error('Remove friend error:', error);
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 100], [0, -20]),
      },
    ],
  }));

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchBarOpacity.value,
    transform: [{ translateY: interpolate(searchBarOpacity.value, [0, 1], [30, 0]) }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [50, 0]) }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const renderFriend = ({ item, index }: { item: FriendWithBalance; index: number }) => (
    <Animated.View
      style={[
        styles.friendItem,
        {
          opacity: contentOpacity,
          transform: [
            {
              translateY: interpolate(
                contentOpacity.value,
                [0, 1],
                [30 * (index + 1), 0]
              ),
            },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.friendContent}
        onPress={() => handleFriendPress(item)}
      >
        <View style={styles.friendInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.friendEmail}>{item.email}</Text>
            {item.balance !== undefined && item.balance !== 0 && (
              <Text style={styles.balanceStatus}>
                {item.balanceMessage || 'You are settled up'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.friendActions}>
          {item.balance !== undefined && item.balance !== 0 && (
            <View style={[
              styles.balanceChip,
              { backgroundColor: item.balance > 0 ? '#E8F5E8' : '#FFE8E8' }
            ]}>
              <Text style={[
                styles.balanceText,
                { color: item.balance > 0 ? '#4CAF50' : '#ff4757' }
              ]}>
                {item.balance > 0 ? '+' : ''}${Math.abs(item.balance).toFixed(2)}
              </Text>
            </View>
          )}
          <Pressable
            style={styles.actionButton}
            onPress={() => handleRemoveFriend(item._id, item.name)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
      
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <Text style={styles.headerTitle}>Friends</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddFriendModal(true)}
          >
            <Ionicons name="person-add" size={24} color="#ffffff" />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.searchContainer, searchBarAnimatedStyle]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <Pressable
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
          <Text style={styles.sectionTitle}>
            Your Friends ({friends.length})
          </Text>
          
          {filteredFriends.length > 0 ? (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriend}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={styles.friendsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Add some friends to start splitting expenses'
                }
              </Text>
              {!searchQuery && (
                <Pressable
                  style={styles.addFriendButton}
                  onPress={() => setShowAddFriendModal(true)}
                >
                  <Text style={styles.addFriendButtonText}>Add Your First Friend</Text>
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>

      <AddFriendModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onFriendAdded={handleFriendAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  contentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
    minHeight: 400,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  friendsList: {
    paddingBottom: 20,
  },
  friendItem: {
    marginBottom: 12,
  },
  friendContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  balanceStatus: {
    fontSize: 12,
    color: '#999',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addFriendButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFriendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
