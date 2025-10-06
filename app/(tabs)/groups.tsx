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
import { GroupService, Group } from '../../googleServices/groupService';
import JoinGroupModal from '../../components/JoinGroupModal';

const { width, height } = Dimensions.get('window');

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const searchBarOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadGroups();
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    searchBarOpacity.value = withDelay(400, withSpring(1));
    contentOpacity.value = withDelay(600, withSpring(1));
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await GroupService.getUserGroups();
      setGroups(userGroups);
    } catch (error) {
      console.error('Load groups error:', error);
      Alert.alert('Error', 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  }, []);

  const handleGroupJoined = useCallback(() => {
    loadGroups(); // Refresh the groups list
  }, []);

  const handleGroupPress = (group: Group) => {
    router.push({
      pathname: '/group-detail',
      params: {
        groupId: group._id,
        groupName: group.name,
      },
    });
  };

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  const getCurrentUserId = () => {
    return 'current_user_id'; // Should be retrieved from auth context
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

  const renderGroup = ({ item, index }: { item: Group; index: number }) => {
    const currentUserId = getCurrentUserId();
    const isAdmin = GroupService.isGroupAdmin(item, currentUserId);
    const memberRole = GroupService.getMemberRole(item, currentUserId);

    return (
      <Animated.View
        style={[
          styles.groupItem,
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
          style={styles.groupContent}
          onPress={() => handleGroupPress(item)}
        >
          <View style={styles.groupInfo}>
            <View style={styles.groupAvatarContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.groupAvatar}
              >
                <Text style={styles.groupAvatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                </View>
              )}
            </View>
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.groupDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
              <View style={styles.groupMetadata}>
                <Text style={styles.groupMetadataText}>
                  {GroupService.formatMemberCount(item.members.length)}
                </Text>
                {item.totalExpenses !== undefined && (
                  <Text style={styles.groupMetadataText}>
                    • {GroupService.formatExpenseCount(item.totalExpenses)}
                  </Text>
                )}
                {memberRole && (
                  <Text style={[styles.roleText, { color: isAdmin ? '#FFD700' : '#4CAF50' }]}>
                    • {memberRole}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.groupActions}>
            {item.totalAmount !== undefined && item.totalAmount > 0 && (
              <View style={styles.amountChip}>
                <Text style={styles.amountText}>
                  ${item.totalAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading groups...</Text>
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
          <Text style={styles.headerTitle}>Groups</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setShowJoinGroupModal(true)}
            >
              <Ionicons name="search" size={20} color="#ffffff" />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={handleCreateGroup}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.searchContainer, searchBarAnimatedStyle]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your groups..."
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Your Groups ({groups.length})
            </Text>
            <Pressable style={styles.createGroupButton} onPress={handleCreateGroup}>
              <Ionicons name="add" size={16} color="#667eea" />
              <Text style={styles.createGroupText}>Create Group</Text>
            </Pressable>
          </View>
          
          {filteredGroups.length > 0 ? (
            <FlatList
              data={filteredGroups}
              renderItem={renderGroup}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={styles.groupsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="albums" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No groups found' : 'No groups yet'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Create or join a group to start splitting expenses'
                }
              </Text>
              {!searchQuery && (
                <View style={styles.emptyStateActions}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={handleCreateGroup}
                  >
                    <Text style={styles.primaryButtonText}>Create Group</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setShowJoinGroupModal(true)}
                  >
                    <Text style={styles.secondaryButtonText}>Join Group</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>

      <JoinGroupModal
        visible={showJoinGroupModal}
        onClose={() => setShowJoinGroupModal(false)}
        onGroupJoined={handleGroupJoined}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  createGroupText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  groupsList: {
    paddingBottom: 20,
  },
  groupItem: {
    marginBottom: 12,
  },
  groupContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  adminBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  groupMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMetadataText: {
    fontSize: 12,
    color: '#999',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
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
    marginBottom: 24,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
});
