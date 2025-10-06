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
  TextInput,
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
import { ExpenseService, ExpenseDetail } from '../googleServices/expenseService';
import { AuthService } from '../googleServices/authService';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'food', name: 'Food & Dining' },
  { id: 'transport', name: 'Transportation' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'travel', name: 'Travel' },
  { id: 'other', name: 'Other' },
];

export default function ExpenseDetailScreen() {
  const { expenseId } = useLocalSearchParams<{
    expenseId: string;
  }>();

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Edit form state
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    loadCurrentUser();
    if (expenseId) {
      loadExpenseDetails();
    }
    // Start animations
    headerOpacity.value = withDelay(200, withSpring(1));
    contentOpacity.value = withDelay(400, withSpring(1));
  }, [expenseId]);

  const loadCurrentUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setCurrentUserId(currentUser.id);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadExpenseDetails = async () => {
    if (!expenseId) return;

    setLoading(true);
    try {
      const expenseData = await ExpenseService.getExpenseById(expenseId);
      setExpense(expenseData);
      
      // Initialize edit form with current data
      setEditDescription(expenseData.description);
      setEditAmount(expenseData.amount.toString());
      setEditCategory(expenseData.category);
    } catch (error) {
      console.error('Load expense details error:', error);
      Alert.alert('Error', 'Failed to load expense details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExpenseDetails();
    setRefreshing(false);
  };

  const getCurrentUserId = () => {
    return currentUserId;
  };

  const handleSettleSplit = async (userId: string) => {
    if (!expense) return;

    setSettling(userId);
    try {
      const updatedExpense = await ExpenseService.settleExpenseSplit(expense._id, userId);
      setExpense(updatedExpense);
      Alert.alert('Success', 'Split settled successfully!');
    } catch (error: any) {
      console.error('Settle split error:', error);
      Alert.alert('Error', error.message || 'Failed to settle split. Please try again.');
    } finally {
      setSettling(null);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expense) return;

    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ExpenseService.deleteExpense(expense._id);
              router.back();
              Alert.alert('Success', 'Expense deleted successfully!');
            } catch (error: any) {
              console.error('Delete expense error:', error);
              Alert.alert('Error', error.message || 'Failed to delete expense. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditExpense = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!expense) return;
    
    // Reset form to original values
    setEditDescription(expense.description);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!expense) return;

    // Validation
    if (!editDescription.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!editAmount.trim() || isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const updatedExpense = await ExpenseService.updateExpense(expense._id, {
        description: editDescription.trim(),
        amount: parseFloat(editAmount),
        category: editCategory,
      });
      
      setExpense(updatedExpense);
      setIsEditing(false);
      Alert.alert('Success', 'Expense updated successfully!');
    } catch (error: any) {
      console.error('Update expense error:', error);
      Alert.alert('Error', error.message || 'Failed to update expense. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSplitItem = (split: ExpenseDetail['splitWith'][0]) => {
    const currentUserId = getCurrentUserId();
    const isCurrentUser = split.user._id === currentUserId;
    const canSettle = expense?.paidBy._id === currentUserId && !split.settled && !isCurrentUser;

    return (
      <Animated.View
        key={split.user._id}
        style={[
          styles.splitItem,
          {
            opacity: contentOpacity,
            transform: [
              {
                translateY: interpolate(contentOpacity.value, [0, 1], [20, 0]),
              },
            ],
          },
        ]}
      >
        <View style={styles.splitUserInfo}>
          <LinearGradient
            colors={isCurrentUser ? ['#4CAF50', '#45a049'] : ['#667eea', '#764ba2']}
            style={styles.splitAvatar}
          >
            <Text style={styles.splitAvatarText}>
              {split.user.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.splitUserDetails}>
            <Text style={styles.splitUserName}>
              {isCurrentUser ? 'You' : split.user.name}
            </Text>
            <Text style={styles.splitUserEmail}>{split.user.email}</Text>
          </View>
        </View>
        <View style={styles.splitAmount}>
          <Text style={styles.splitAmountText}>
            {ExpenseService.formatAmount(split.amount, expense?.currency)}
          </Text>
          {split.settled ? (
            <View style={styles.settledBadge}>
              <Text style={styles.settledText}>Settled</Text>
            </View>
          ) : canSettle ? (
            <Pressable
              style={[styles.settleButton, settling === split.user._id && styles.settleButtonDisabled]}
              onPress={() => handleSettleSplit(split.user._id)}
              disabled={settling === split.user._id}
            >
              {settling === split.user._id ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.settleButtonText}>Settle</Text>
              )}
            </Pressable>
          ) : !split.settled ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
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
          <Text style={styles.loadingText}>Loading expense details...</Text>
        </View>
      </>
    );
  }

  if (!expense) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.errorContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
          <Ionicons name="alert-circle" size={64} color="#ffffff" />
          <Text style={styles.errorText}>Failed to load expense details</Text>
          <Pressable style={styles.retryButton} onPress={loadExpenseDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
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
            <Text style={styles.headerTitle}>Expense Details</Text>
            <Text style={styles.headerSubtitle}>{expense.description}</Text>
          </View>
          {expense.paidBy._id === getCurrentUserId() && !expense.isSettled && (
            <View style={styles.headerActions}>
              {isEditing ? (
                <>
                  <Pressable style={styles.headerButton} onPress={handleCancelEdit}>
                    <Ionicons name="close" size={20} color="#ffffff" />
                  </Pressable>
                  <Pressable style={styles.headerButton} onPress={handleSaveEdit}>
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.headerButton} onPress={handleEditExpense}>
                  <Ionicons name="create" size={20} color="#ffffff" />
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#ffffff"
              colors={['#ffffff']}
            />
          }
        >
          <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
            {/* Expense Info Card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expense Information</Text>
              <View style={styles.infoCard}>
                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.editInput}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="Description"
                      placeholderTextColor="#999"
                    />
                    <View style={styles.amountInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.editAmountInput}
                        value={editAmount}
                        onChangeText={setEditAmount}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        placeholderTextColor="#999"
                      />
                    </View>
                    <View style={styles.categorySelector}>
                      <Text style={styles.categoryLabel}>Category:</Text>
                      <View style={styles.categoryButtons}>
                        {categories.map((category) => (
                          <Pressable
                            key={category.id}
                            style={[
                              styles.categoryButton,
                              editCategory === category.id && styles.selectedCategoryButton,
                            ]}
                            onPress={() => setEditCategory(category.id)}
                          >
                            <Text
                              style={[
                                styles.categoryButtonText,
                                editCategory === category.id && styles.selectedCategoryButtonText,
                              ]}
                            >
                              {category.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={styles.expenseAmount}>
                      {ExpenseService.formatAmount(expense.amount, expense.currency)}
                    </Text>
                    <View style={styles.expenseMetadata}>
                      <View style={styles.metadataItem}>
                        <Ionicons name="calendar" size={16} color="#666" />
                        <Text style={styles.metadataText}>{formatDate(expense.date)}</Text>
                      </View>
                      <View style={styles.metadataItem}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.metadataText}>{formatTime(expense.createdAt)}</Text>
                      </View>
                      <View style={styles.metadataItem}>
                        <Ionicons name="pricetag" size={16} color="#666" />
                        <Text style={styles.metadataText}>{expense.category}</Text>
                      </View>
                      {expense.group && (
                        <View style={styles.metadataItem}>
                          <Ionicons name="people" size={16} color="#666" />
                          <Text style={styles.metadataText}>{expense.group.name}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Paid By Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Paid By</Text>
              <View style={styles.paidByCard}>
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.paidByAvatar}
                >
                  <Text style={styles.paidByAvatarText}>
                    {expense.paidBy.name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.paidByInfo}>
                  <Text style={styles.paidByName}>
                    {expense.paidBy._id === getCurrentUserId() ? 'You' : expense.paidBy.name}
                  </Text>
                  <Text style={styles.paidByEmail}>{expense.paidBy.email}</Text>
                </View>
              </View>
            </View>

            {/* Split Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Split Details</Text>
              <View style={styles.splitContainer}>
                {expense.splitWith.map(renderSplitItem)}
              </View>
            </View>

            {/* Actions Section */}
            {expense.paidBy._id === getCurrentUserId() && !expense.isSettled && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions</Text>
                <View style={styles.actionsContainer}>
                  <Pressable style={styles.deleteButton} onPress={handleDeleteExpense}>
                    <Ionicons name="trash" size={20} color="#ffffff" />
                    <Text style={styles.deleteButtonText}>Delete Expense</Text>
                  </Pressable>
                </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  expenseDescription: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 16,
  },
  expenseMetadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  paidByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  paidByAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paidByAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  paidByInfo: {
    flex: 1,
  },
  paidByName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paidByEmail: {
    fontSize: 14,
    color: '#666',
  },
  splitContainer: {
    gap: 12,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  splitUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  splitAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  splitAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  splitUserDetails: {
    flex: 1,
  },
  splitUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  splitUserEmail: {
    fontSize: 12,
    color: '#666',
  },
  splitAmount: {
    alignItems: 'flex-end',
  },
  splitAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
  },
  settleButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  settleButtonDisabled: {
    backgroundColor: '#ccc',
  },
  settleButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    marginRight: 8,
  },
  editAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  categorySelector: {
    marginTop: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedCategoryButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#ffffff',
  },
});
