import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { Group } from '../../services/groups';
import { expensesService, Expense } from '../../services/expenses';

interface RouteParams {
  group: Group;
}

const GroupDescriptionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { group } = route.params as RouteParams;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroupExpenses();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGroupExpenses();
    }, [])
  );

  const loadGroupExpenses = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Use the dedicated group expenses API endpoint
      const response = await expensesService.getGroupExpenses(group._id);
      console.log('Group Expenses Response:', response);
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Error loading group expenses:', error);
      Alert.alert('Error', 'Unable to load group expenses. Please try again.');
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadGroupExpenses(true);
  };

  const navigateToSettings = () => {
    navigation.navigate('GroupSettings', { group });
  };

  const navigateToExpenseDetail = (expense: Expense) => {
    navigation.navigate('ExpenseDetail', { expense });
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTotalGroupExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
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

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top - 15 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={navigateToSettings}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Group Details Section */}
        <View style={styles.section}>
          <View style={styles.groupHeader}>
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={32} color={colors.primary[600]} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              {group.description && (
                <Text style={styles.groupDescription}>{group.description}</Text>
              )}
              <Text style={styles.memberCount}>
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Group Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatAmount(getTotalGroupExpenses())}</Text>
              <Text style={styles.statLabel}>Total Expenses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{expenses.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>
        </View>

        {/* Expenses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Expenses</Text>
            <TouchableOpacity
              style={styles.addExpenseButton}
              onPress={() => navigation.navigate('AddExpense', { group })}
            >
              <Ionicons name="add" size={20} color={colors.primary[600]} />
              <Text style={styles.addExpenseText}>Add</Text>
            </TouchableOpacity>
          </View>

          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <TouchableOpacity
                key={expense._id}
                style={styles.expenseItem}
                onPress={() => navigateToExpenseDetail(expense)}
              >
                <View style={styles.expenseIcon}>
                  <Ionicons 
                    name="receipt-outline" 
                    size={20} 
                    color={colors.primary[600]} 
                  />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
                  <Text style={styles.expenseDetails}>
                    Paid by {expense.paidBy.name} • {formatDate(expense.date)}
                  </Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                </View>
                <View style={styles.expenseAmount}>
                  <Text style={styles.expenseAmountText}>
                    {formatAmount(expense.amount)}
                  </Text>
                  {expense.isSettled && (
                    <Text style={styles.settledBadge}>Settled</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyExpenses}>
              <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyExpensesTitle}>No expenses yet</Text>
              <Text style={styles.emptyExpensesText}>
                Start adding expenses to track group spending
              </Text>
              <TouchableOpacity
                style={styles.addFirstExpenseButton}
                onPress={() => navigation.navigate('AddExpense', { group })}
              >
                <Text style={styles.addFirstExpenseText}>Add First Expense</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  groupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
  },
  addExpenseText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
    marginLeft: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  expenseDetails: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  settledBadge: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyExpensesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyExpensesText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstExpenseButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFirstExpenseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default GroupDescriptionScreen;