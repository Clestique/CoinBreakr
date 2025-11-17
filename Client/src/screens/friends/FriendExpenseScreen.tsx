import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { expensesService, Expense } from '../../services/expenses';
import { Friend } from '../../services/friends';
import { useAuth } from '../../hooks/useAuth';

interface RouteParams {
  friend: Friend;
}

const FriendExpenseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { friend } = route.params as RouteParams;
  const { userId } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    loadExpenses();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh expenses when screen comes into focus
      loadExpenses();
    }, [])
  );

  // Recalculate balance whenever expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      calculateBalance(expenses);
    }
  }, [expenses, userId]);

  const loadExpenses = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await expensesService.getUserExpenses({
        friendId: friend._id,
        page: pageNum,
        limit: 20,
      });

      const newExpenses = response.data || [];
      let allExpenses: Expense[];

      if (pageNum === 1) {
        setExpenses(newExpenses);
        allExpenses = newExpenses;
      } else {
        const updatedExpenses = [...expenses, ...newExpenses];
        setExpenses(updatedExpenses);
        allExpenses = updatedExpenses;
      }

      setHasMore(pageNum < response.pagination.pages);
      setPage(pageNum);

      // Calculate balance with the correct expense list
      calculateBalance(allExpenses);

    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Unable to load expenses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateBalance = (expensesList: Expense[]) => {
    if (!userId) return;

    let balance = 0;

    expensesList.forEach(expense => {
      // If current user paid the expense
      if (expense.paidBy._id === userId) {
        // Find how much friend owes
        const friendSplit = expense.splitWith.find(split => split.user._id === friend._id);
        if (friendSplit && !friendSplit.settled) {
          balance += friendSplit.amount; // Friend owes money (positive)
        }
      } else if (expense.paidBy._id === friend._id) {
        // If friend paid the expense
        const userSplit = expense.splitWith.find(split => split.user._id === userId);
        if (userSplit && !userSplit.settled) {
          balance -= userSplit.amount; // User owes money (negative)
        }
      }
    });

    setTotalBalance(balance);
  };

  const onRefresh = () => {
    loadExpenses(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadExpenses(page + 1);
    }
  };

  const handleExpensePress = (expense: Expense) => {
    // Navigate to expense detail screen
    navigation.navigate('ExpenseDetail', { expense });
  };

  const handleSettleUp = () => {
    if (totalBalance === 0) {
      Alert.alert('All Settled', 'You and your friend are all settled up!');
      return;
    }

    const message = totalBalance > 0
      ? `${friend.name} owes you $${Math.abs(totalBalance).toFixed(2)}`
      : `You owe ${friend.name} $${Math.abs(totalBalance).toFixed(2)}`;

    Alert.alert(
      'Settle Up',
      message + '\n\nWould you like to record this as settled?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settle Up', onPress: settleAllExpenses }
      ]
    );
  };

  const settleAllExpenses = async () => {
    try {
      setLoading(true);

      // Find all unsettled expenses where either user paid or friend paid
      const unsettledExpenses = expenses.filter(expense => {
        if (expense.isSettled) return false;

        // Check if this expense involves both users and has unsettled splits
        const userSplit = expense.splitWith.find(split => split.user._id === userId);
        const friendSplit = expense.splitWith.find(split => split.user._id === friend._id);

        // Include expense if either user or friend paid and there are unsettled splits
        if (expense.paidBy._id === userId && friendSplit && !friendSplit.settled) {
          return true;
        }
        if (expense.paidBy._id === friend._id && userSplit && !userSplit.settled) {
          return true;
        }

        return false;
      });

      if (unsettledExpenses.length === 0) {
        Alert.alert('No Expenses', 'No unsettled expenses found.');
        return;
      }

      // Settle all unsettled expenses
      const settlePromises = unsettledExpenses.map(expense =>
        expensesService.settleExpense(expense._id)
      );

      await Promise.all(settlePromises);

      Alert.alert(
        'Success',
        `Successfully settled ${unsettledExpenses.length} expense(s) with ${friend.name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh the expenses list to show updated status
              loadExpenses(1, true);
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error settling expenses:', error);
      Alert.alert('Error', error.message || 'Failed to settle expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCharts = () => {
    Alert.alert('Charts', 'Charts feature coming soon!');
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export to XLS functionality will be implemented');
  };

  const handleFriendDetails = () => {
    // Navigate to friend details screen
    navigation.navigate('FriendDetails', { friend });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getExpenseStatus = (expense: Expense) => {
    if (!userId || expense.isSettled) return 'settled';

    // Check if current user paid
    const userPaid = expense.paidBy._id === userId;
    const friendSplit = expense.splitWith.find(split => split.user._id === friend._id);
    const userSplit = expense.splitWith.find(split => split.user._id === userId);

    if (userPaid && friendSplit && !friendSplit.settled) {
      return 'friend_owes';
    } else if (!userPaid && userSplit && !userSplit.settled) {
      return 'user_owes';
    }

    return 'settled';
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Image
            source={{ uri: friend.profileImage || 'https://placehold.co/32x32' }}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerTitle}>{friend.name}</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleFriendDetails}>
          <Ionicons name="information-circle-outline" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Balance Summary */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Overall Balance</Text>
        <Text style={[
          styles.balanceAmount,
          { color: totalBalance === 0 ? colors.text.tertiary : totalBalance > 0 ? colors.success : colors.error }
        ]}>
          {totalBalance === 0
            ? 'All settled up!'
            : totalBalance > 0
              ? `${friend.name} owes you $${Math.abs(totalBalance).toFixed(2)}`
              : `You owe $${Math.abs(totalBalance).toFixed(2)}`
          }
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSettleUp}>
          <Text style={styles.actionButtonText}>Settle Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleCharts}>
          <Text style={styles.actionButtonText}>Charts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {expenses.length > 0 ? (
            <>
              {expenses.map((expense, index) => {
                const status = getExpenseStatus(expense);
                const userPaid = expense.paidBy._id === userId;
                const splitAmount = expense.splitWith.find(split =>
                  userPaid ? split.user._id === friend._id : split.user._id === userId
                )?.amount || 0;

                return (
                  <TouchableOpacity
                    key={expense._id}
                    style={[
                      styles.expenseItem,
                      index === expenses.length - 1 && styles.lastExpenseItem
                    ]}
                    onPress={() => handleExpensePress(expense)}
                  >
                    <View style={styles.expenseLeft}>
                      <View style={styles.expenseIcon}>
                        <Ionicons
                          name="receipt-outline"
                          size={20}
                          color={colors.primary[600]}
                        />
                      </View>
                      <View style={styles.expenseInfo}>
                        <View style={styles.expenseTitleContainer}>
                          <Text style={styles.expenseTitle}>{expense.title}</Text>
                          {expense.group && (
                            <View style={styles.groupBadge}>
                              <Ionicons name="people" size={14} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.expenseDate}>
                          {formatDate(expense.date)} • Paid by {expense.paidBy.name}
                        </Text>
                        {expense.description && (
                          <Text style={styles.expenseDescription}>{expense.description}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                      {status !== 'settled' && (
                        <Text style={[
                          styles.expenseStatus,
                          {
                            color: status === 'friend_owes' ? colors.success : colors.error
                          }
                        ]}>
                          {status === 'friend_owes'
                            ? `+$${splitAmount.toFixed(2)}`
                            : `-$${splitAmount.toFixed(2)}`
                          }
                        </Text>
                      )}
                      {status === 'settled' && (
                        <Text style={styles.settledText}>Settled</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {loading && expenses.length > 0 && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>
                Start splitting expenses with {friend.name} to see them here
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add Expense FAB */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => {
          // Navigate to add expense screen with friend pre-selected
          navigation.navigate('AddExpense', { selectedFriend: friend });
        }}
      >
        <View style={styles.fabContent}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Expense</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.body,
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: colors.background.tertiary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerButton: {
    padding: 8,
  },
  balanceContainer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    backgroundColor: colors.background.primary,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 20,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
    marginBottom: -15
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastExpenseItem: {
    borderBottomWidth: 0,
  },
  expenseLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  groupBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  expenseDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  expenseStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  settledText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
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
  },
  fabButton: {
    position: 'absolute',
    bottom: 85, // Above tab bar
    right: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FriendExpenseScreen;