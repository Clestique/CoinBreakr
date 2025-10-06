import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { GroupService, Group, GroupExpense } from '../googleServices/groupService';

const { width } = Dimensions.get('window');

export default function GroupDetailScreen() {
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    contentOpacity.value = withDelay(400, withSpring(1));
  }, [groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const [groupData, expensesData] = await Promise.all([
        GroupService.getGroupById(groupId),
        GroupService.getGroupExpenses(groupId)
      ]);

      setGroup(groupData);
      setExpenses(expensesData.data || []);
    } catch (error) {
      console.error('Load group data error:', error);
      Alert.alert('Error', 'Failed to load group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  }, []);

  const getCurrentUserId = () => {
    return 'current_user_id'; // Should be retrieved from auth context
  };

  const handleAddExpense = () => {
    router.push({
      pathname: '/add-expense',
      params: {
        groupId: groupId,
        groupName: group?.name || groupName,
      },
    });
  };

  const handleExpensePress = (expenseId: string) => {
    router.push({
      pathname: '/expense-detail',
      params: {
        expenseId: expenseId,
      },
    });
  };

  const handleGroupSettings = () => {
    router.push({
      pathname: '/group-settings',
      params: {
        groupId: groupId,
      },
    });
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderExpense = (expense: GroupExpense, index: number) => {
    const currentUserId = getCurrentUserId();
    const isPaidByCurrentUser = expense.paidBy._id === currentUserId;
    const userSplit = expense.splitWith.find(split => split.user._id === currentUserId);

    let amountText = '';
    let amountColor = '#666';

    if (isPaidByCurrentUser) {
      amountText = `You paid $${expense.amount.toFixed(2)}`;
      amountColor = '#4CAF50';
    } else {
      amountText = `${expense.paidBy.name} paid $${expense.amount.toFixed(2)}`;
      if (userSplit && !userSplit.settled) {
        amountText += ` (you owe $${userSplit.amount.toFixed(2)})`;
        amountColor = '#ff4757';
      }
    }

    return (
      <Pressable
        key={expense._id}
        onPress={() => handleExpensePress(expense._id)}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.expenseItem,
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
          <View style={styles.expenseHeader}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDescription}>{expense.description}</Text>
              <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
            </View>
            <View style={styles.expenseAmount}>
              <Text style={[styles.amountText, { color: amountColor }]}>
                {amountText}
              </Text>
              {expense.isSettled && (
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>Settled</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.expenseCategory}>
            <Ionicons 
              name="pricetag" 
              size={14} 
              color="#999" 
              style={styles.categoryIcon} 
            />
            <Text style={styles.categoryText}>{expense.category}</Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  };


  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]),
      },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [30, 0]) }],
  }));

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.errorContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
          <Ionicons name="alert-circle" size={64} color="#ffffff" />
          <Text style={styles.errorText}>Failed to load group details</Text>
          <Pressable style={styles.retryButton} onPress={loadGroupData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const currentUserId = getCurrentUserId();
  const isAdmin = GroupService.isGroupAdmin(group, currentUserId);
  const groupStats = GroupService.getGroupStats(group, expenses);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
        
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{group.name}</Text>
            <Text style={styles.headerSubtitle}>
              {GroupService.formatMemberCount(groupStats.memberCount)} • 
              {GroupService.formatExpenseCount(groupStats.totalExpenses)}
            </Text>
          </View>
          <Pressable style={styles.settingsButton} onPress={handleGroupSettings}>
            <Ionicons name="settings-outline" size={20} color="#ffffff" />
          </Pressable>
        </Animated.View>

        {/* Group Stats Card */}
        <Animated.View style={[styles.statsCard, contentAnimatedStyle]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${groupStats.totalAmount.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{groupStats.settledExpenses}</Text>
              <Text style={styles.statLabel}>Settled</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{groupStats.pendingExpenses}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </Animated.View>


        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#667eea"
              colors={['#667eea']}
            />
          }
        >
          <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Recent Expenses ({expenses.length})
              </Text>
              <Pressable style={styles.addExpenseButton} onPress={handleAddExpense}>
                <Ionicons name="add" size={16} color="#667eea" />
                <Text style={styles.addExpenseText}>Add Expense</Text>
              </Pressable>
            </View>
            
            {expenses.length > 0 ? (
              expenses.map((expense, index) => renderExpense(expense, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No expenses yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Add your first group expense to get started
                </Text>
                <Pressable style={styles.addFirstExpenseButton} onPress={handleAddExpense}>
                  <Text style={styles.addFirstExpenseText}>Add First Expense</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>

    </>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
    minHeight: 300,
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
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addExpenseText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  expenseItem: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settledBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  settledText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  expenseCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
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
  addFirstExpenseButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFirstExpenseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
