import React, { useEffect, useState } from 'react';
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
import { FriendsService, Friend } from '../googleServices/friendsService';

const { width } = Dimensions.get('window');

interface Expense {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  splitWith: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    amount: number;
    settled: boolean;
  }>;
  isSettled: boolean;
  category: string;
}

export default function FriendExpensesScreen() {
  const { friendId, friendName } = useLocalSearchParams<{
    friendId: string;
    friendName: string;
  }>();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [balanceMessage, setBalanceMessage] = useState<string>('');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadData();
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    contentOpacity.value = withDelay(400, withSpring(1));
  }, [friendId]);

  const loadData = async () => {
    if (!friendId) return;

    try {
      setLoading(true);
      const [expensesResponse, balanceResponse] = await Promise.all([
        FriendsService.getExpensesWithFriend(friendId),
        FriendsService.getFriendBalance(friendId)
      ]);

      setExpenses(expensesResponse.data || []);
      setFriend(balanceResponse.friend);
      setBalance(balanceResponse.balance);
      setBalanceMessage(balanceResponse.message);
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCurrentUserId = () => {
    // This should be retrieved from your auth context or storage
    // For now, we'll use a placeholder - you should implement proper user ID retrieval
    return 'current_user_id';
  };

  const handleExpensePress = (expenseId: string) => {
    router.push({
      pathname: '/expense-detail',
      params: {
        expenseId: expenseId,
      },
    });
  };

  const renderExpense = (expense: Expense, index: number) => {
    const currentUserId = getCurrentUserId();
    const isPaidByCurrentUser = expense.paidBy._id === currentUserId;
    const userSplit = expense.splitWith.find(split => split.user._id === currentUserId);
    const friendSplit = expense.splitWith.find(split => split.user._id === friendId);

    let amountText = '';
    let amountColor = '#666';

    if (isPaidByCurrentUser) {
      amountText = `You paid $${expense.amount.toFixed(2)}`;
      if (friendSplit && !friendSplit.settled) {
        amountText += ` (owed $${friendSplit.amount.toFixed(2)})`;
        amountColor = '#4CAF50';
      }
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
  }));

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      </>
    );
  }

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
            <Text style={styles.headerTitle}>
              Expenses with {friend?.name || friendName}
            </Text>
            <Text style={styles.headerSubtitle}>{balanceMessage}</Text>
          </View>
        </Animated.View>

      <Animated.View style={[styles.balanceCard, contentAnimatedStyle]}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[
          styles.balanceAmount,
          { color: balance > 0 ? '#4CAF50' : balance < 0 ? '#ff4757' : '#666' }
        ]}>
          {balance > 0 ? '+' : ''}${Math.abs(balance).toFixed(2)}
        </Text>
        <Text style={styles.balanceDescription}>
          {balance > 0 
            ? `${friend?.name || friendName} owes you` 
            : balance < 0 
            ? `You owe ${friend?.name || friendName}`
            : 'You are settled up'
          }
        </Text>
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
        <Animated.View style={[styles.expensesContainer, contentAnimatedStyle]}>
          <Text style={styles.sectionTitle}>
            Expense History ({expenses.length})
          </Text>
          
          {expenses.length > 0 ? (
            expenses.map((expense, index) => renderExpense(expense, index))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No expenses yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Create your first expense together to get started
              </Text>
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
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  expensesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
    minHeight: 300,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
  },
});
