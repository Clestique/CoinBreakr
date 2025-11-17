import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Animated, RefreshControl } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { groupsService, Group } from '../../services/groups';

// Constants for consistent sizing across all screens
const TAB_BAR_HEIGHT = 65; // From TabNavigator configuration

const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<Group[]>([]);
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
        loadGroups(false); // Don't show refresh spinner for navigation refresh
        // Clear the refresh parameter to prevent repeated refreshes
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params])
  );

  const checkInitialState = async () => {
    try {
      await loadGroups();
    } catch (error) {
      console.error('Error checking initial state:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      const response = await groupsService.getGroups();
      setGroups(response.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Unable to load groups. Please check your connection and try again.');
      setGroups([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    loadGroups(true);
  };

  const navigateToCreateGroup = () => {
    setShowFabOptions(false);
    navigation.navigate('CreateGroup');
  };

  const handleAddExpense = () => {
    setShowFabOptions(false);
    // Navigate to add expense screen without pre-selected group
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </View>
    );
  }

  const hasGroups = groups.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={navigateToCreateGroup}
        >
          <Ionicons name="add-outline" size={24} color={colors.text.secondary} />
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
          {hasGroups ? (
            <>
              {/* Groups List */}
              {groups.map((group, index) => (
                <TouchableOpacity
                  key={`group-${group._id || index}`}
                  style={styles.groupItem}
                  onPress={() => {
                    closeFabOptions();
                    navigation.navigate('GroupExpenses', { group });
                  }}
                >
                  <View style={styles.groupIcon}>
                    <Ionicons name="people" size={24} color={colors.primary[600]} />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDescription}>
                      {group.description || `${group.members.length} members`}
                    </Text>
                    <Text style={styles.memberCount}>
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}

              {/* Add New Group Button */}
              <View style={styles.addNewGroupContainer}>
                <TouchableOpacity
                  style={styles.addNewGroupButton}
                  onPress={navigateToCreateGroup}
                >
                  <Ionicons name="add-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.addNewGroupText}>Create new group</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Empty State */
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>
                Create groups to split expenses with multiple friends and organize your shared costs
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
              <Text style={styles.fabOptionLabel}>Create Group</Text>
              <TouchableOpacity
                style={styles.fabOption}
                onPress={navigateToCreateGroup}
              >
                <Ionicons name="people" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {hasGroups && (
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
    </View>
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
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  transactionBadge: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },
  addNewGroupContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  addNewGroupButton: {
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
  addNewGroupText: {
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

export default GroupsScreen;