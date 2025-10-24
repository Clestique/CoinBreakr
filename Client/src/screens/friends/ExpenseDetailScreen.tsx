import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { expensesService, Expense } from '../../services/expenses';
import { friendsService } from '../../services/friends';
import { useAuth } from '../../hooks/useAuth';

interface RouteParams {
  expense: Expense;
}

// Categories for expense categorization
const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Travel',
  'Healthcare',
  'Education',
  'Groceries',
  'Other'
];

const ExpenseDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { expense: initialExpense } = route.params as RouteParams;
  const { userId } = useAuth();

  // Safety check for expense data
  if (!initialExpense || !initialExpense._id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: Expense data not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [expense, setExpense] = useState<Expense>(initialExpense);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: initialExpense.title || '',
    description: initialExpense.description || '',
    amount: initialExpense.amount?.toString() || '0',
    date: new Date(initialExpense.date || new Date()),
    category: initialExpense.category || 'Other',
    paidBy: initialExpense.paidBy?._id || userId || '',
    splitWith: (initialExpense.splitWith || []).map(split => ({
      userId: split.user?._id || '',
      userName: split.user?.name || '',
      userImage: split.user?.profileImage,
      amount: split.amount?.toString() || '0',
      isPaid: split.isPaid || false
    }))
  });

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsData = await friendsService.getFriends();
      setFriends(friendsData.friends || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await expensesService.deleteExpense(expense._id);

      Alert.alert(
        'Success',
        'Expense has been deleted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', error.message || 'Unable to delete expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount?.toString() || '0',
      date: new Date(expense.date || new Date()),
      category: expense.category || 'Other',
      paidBy: expense.paidBy?._id || userId || '',
      splitWith: (expense.splitWith || []).map(split => ({
        userId: split.user?._id || '',
        userName: split.user?.name || '',
        userImage: split.user?.profileImage,
        amount: split.amount?.toString() || '0',
        isPaid: split.isPaid || false
      }))
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowDatePicker(false);
    setShowCategoryDropdown(false);
    setShowPaidByDropdown(false);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the expense.');
      return;
    }

    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    // Validate split amounts
    const totalSplitAmount = editForm.splitWith.reduce((sum, split) => {
      const splitAmount = parseFloat(split.amount || '0');
      return sum + (isNaN(splitAmount) ? 0 : splitAmount);
    }, 0);

    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      Alert.alert(
        'Validation Error',
        `Split amounts ($${totalSplitAmount.toFixed(2)}) must equal the total expense amount ($${amount.toFixed(2)}).`
      );
      return;
    }

    try {
      setLoading(true);

      const updateData: any = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        amount: amount,
        date: editForm.date.toISOString(),
        category: editForm.category,
        splitWith: editForm.splitWith.map(split => ({
          user: split.userId,
          amount: parseFloat(split.amount),
          isPaid: split.isPaid
        }))
      };

      // Only include paidBy if it's different from current user
      if (editForm.paidBy !== userId) {
        updateData.paidBy = editForm.paidBy;
      }

      const updatedExpense = await expensesService.updateExpense(expense._id, updateData);

      setExpense(updatedExpense);
      setIsEditing(false);

      Alert.alert('Success', 'Expense has been updated successfully.');
    } catch (error: any) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', error.message || 'Unable to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleExpense = async () => {
    Alert.alert(
      'Settle Expense',
      'Are you sure you want to settle this expense? This will mark all splits as paid.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settle', onPress: confirmSettleExpense }
      ]
    );
  };

  const confirmSettleExpense = async () => {
    try {
      setLoading(true);
      const settledExpense = await expensesService.settleExpense(expense._id);
      setExpense(settledExpense);
      Alert.alert('Success', 'Expense has been settled successfully.');
    } catch (error: any) {
      console.error('Error settling expense:', error);
      Alert.alert('Error', error.message || 'Unable to settle expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSplitAmount = (userId: string, amount: string) => {
    setEditForm(prev => ({
      ...prev,
      splitWith: prev.splitWith.map(split =>
        split.userId === userId ? { ...split, amount } : split
      )
    }));
  };

  const handleDateSelect = (selectedDate: Date) => {
    setEditForm(prev => ({ ...prev, date: selectedDate }));
    setShowDatePicker(false);
  };

  const getPaidByName = () => {
    if (editForm.paidBy === userId) return 'You';

    // First check the current expense participants
    const expenseParticipants = (expense.splitWith || []).map(s => s.user).filter(u => u);
    const participantPayer = expenseParticipants.find(u => u._id === editForm.paidBy);
    if (participantPayer) return participantPayer.name;

    // Then check friends list
    const friendPayer = (friends || []).find(u => u && u._id === editForm.paidBy);
    if (friendPayer) return friendPayer.name;

    return 'Unknown';
  };

  const getAllParticipants = () => {
    // Only show participants who are actually part of this expense
    const participants: Array<{ _id: string; name: string; profileImage?: string }> = [
      { _id: userId || '', name: 'You', profileImage: undefined }
    ];

    // Add other participants from the expense
    if (expense.splitWith) {
      const otherParticipants = expense.splitWith
        .map(s => s.user)
        .filter(u => u && u._id !== userId);
      participants.push(...otherParticipants);
    }

    return participants;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserSplit = () => {
    return (expense.splitWith || []).find(split => split.user?._id === userId);
  };

  const userSplit = getUserSplit();
  const userPaid = expense.paidBy?._id === userId;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background.body} barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top - 15 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Expense' : 'Expense Details'}
        </Text>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSaveEdit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleEdit}
                disabled={loading}
              >
                <Ionicons name="create-outline" size={24} color={colors.primary[600]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDelete}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Overlay for dropdowns */}
      {(showCategoryDropdown || showPaidByDropdown) && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => {
            setShowCategoryDropdown(false);
            setShowPaidByDropdown(false);
          }}
          activeOpacity={1}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Expense Info */}
        <View style={styles.section}>
          <View style={styles.expenseHeader}>
            <View style={styles.expenseIcon}>
              <Ionicons name="receipt" size={32} color={colors.primary[600]} />
            </View>
            <View style={styles.expenseInfo}>
              {isEditing ? (
                <TextInput
                  style={styles.editTitleInput}
                  value={editForm.title}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                  placeholder="Expense title"
                  maxLength={100}
                />
              ) : (
                <Text style={styles.expenseTitle}>{expense.title}</Text>
              )}

              {isEditing ? (
                <View style={styles.editAmountContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.editAmountInput}
                    value={editForm.amount}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, amount: text }))}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    maxLength={10}
                  />
                </View>
              ) : (
                <View style={styles.amountContainer}>
                  <Text style={styles.expenseAmount}>${(expense.amount || 0).toFixed(2)}</Text>
                  {!isEditing && !expense.isSettled && (
                    <TouchableOpacity
                      style={styles.settleButton}
                      onPress={handleSettleExpense}
                      disabled={loading}
                    >
                      <Text style={styles.settleButtonText}>Settle Split</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            {isEditing ? (
              <TextInput
                style={styles.editDescriptionInput}
                value={editForm.description}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                placeholder="Add a description (optional)"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            ) : (
              <Text style={styles.descriptionText}>
                {expense.description || 'No description'}
              </Text>
            )}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentInfo}>
            {/* Paid By */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Paid by</Text>
              {isEditing ? (
                <View style={[styles.dropdownContainer, { position: 'relative', zIndex: showPaidByDropdown ? 1000 : 1 }]}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowPaidByDropdown(!showPaidByDropdown)}
                  >
                    <Text style={styles.dropdownText}>{getPaidByName()}</Text>
                    <Ionicons
                      name={showPaidByDropdown ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>

                  {showPaidByDropdown && (
                    <View style={styles.dropdownOptions}>
                      {getAllParticipants().map((participant) => (
                        <TouchableOpacity
                          key={participant._id}
                          style={[
                            styles.dropdownOption,
                            editForm.paidBy === participant._id && styles.selectedOption
                          ]}
                          onPress={() => {
                            setEditForm(prev => ({ ...prev, paidBy: participant._id || userId || '' }));
                            setShowPaidByDropdown(false);
                          }}
                        >
                          <Image
                            source={{ uri: participant.profileImage || 'https://placehold.co/24x24' }}
                            style={styles.optionAvatar}
                          />
                          <Text style={styles.optionText}>{participant.name}</Text>
                          {editForm.paidBy === participant._id && (
                            <Ionicons name="checkmark" size={16} color={colors.primary[600]} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.paymentUser}>
                  <Image
                    source={{ uri: expense.paidBy?.profileImage || 'https://placehold.co/24x24' }}
                    style={styles.userAvatar}
                  />
                  <Text style={styles.paymentUserName}>{expense.paidBy?.name || 'Unknown'}</Text>
                </View>
              )}
            </View>

            {/* Date */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Date</Text>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {editForm.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              ) : (
                <Text style={styles.paymentValue}>{formatDate(expense.date)}</Text>
              )}
            </View>

            {/* Category */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Category</Text>
              {isEditing ? (
                <View style={[styles.dropdownContainer, { position: 'relative', zIndex: showCategoryDropdown ? 999 : 1 }]}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <Text style={styles.dropdownText}>{editForm.category}</Text>
                    <Ionicons
                      name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.text.tertiary}
                    />
                  </TouchableOpacity>

                  {showCategoryDropdown && (
                    <View style={styles.dropdownOptions}>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.dropdownOption,
                            editForm.category === category && styles.selectedOption
                          ]}
                          onPress={() => {
                            setEditForm(prev => ({ ...prev, category }));
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text style={styles.optionText}>{category}</Text>
                          {editForm.category === category && (
                            <Ionicons name="checkmark" size={16} color={colors.primary[600]} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.paymentValue}>{expense.category || 'Other'}</Text>
              )}
            </View>

            {/* Status */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Status</Text>
              <Text style={[
                styles.paymentValue,
                { color: expense.isSettled ? '#10B981' : '#F59E0B' }
              ]}>
                {expense.isSettled ? 'Settled' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Split Details */}
        <View style={styles.section}>
          <View style={styles.splitHeader}>
            <Text style={styles.sectionTitle}>Split Details</Text>
            {isEditing && (
              <View style={styles.splitValidation}>
                {(() => {
                  const totalSplit = editForm.splitWith.reduce((sum, split) => {
                    const splitAmount = parseFloat(split.amount || '0');
                    return sum + (isNaN(splitAmount) ? 0 : splitAmount);
                  }, 0);
                  const expenseAmount = parseFloat(editForm.amount || '0');
                  const isValid = Math.abs(totalSplit - expenseAmount) <= 0.01;

                  return (
                    <Text style={[
                      styles.splitValidationText,
                      { color: isValid ? '#10B981' : '#EF4444' }
                    ]}>
                      Total: ${totalSplit.toFixed(2)} {isValid ? '✓' : `(Need: $${expenseAmount.toFixed(2)})`}
                    </Text>
                  );
                })()}
              </View>
            )}
          </View>
          <View style={styles.splitContainer}>
            {isEditing ? (
              editForm.splitWith.map((split, index) => (
                <View key={split.userId} style={styles.splitRow}>
                  <View style={styles.splitUser}>
                    <Image
                      source={{ uri: split.userImage || 'https://placehold.co/32x32' }}
                      style={styles.splitAvatar}
                    />
                    <Text style={styles.splitUserName}>{split.userName}</Text>
                  </View>
                  <View style={styles.splitAmount}>
                    <View style={styles.editSplitContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.splitAmountInput}
                        value={split.amount}
                        onChangeText={(text) => updateSplitAmount(split.userId, text)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    </View>
                  </View>
                </View>
              ))
            ) : (
              (expense.splitWith || []).map((split, index) => (
                <View key={index} style={styles.splitRow}>
                  <View style={styles.splitUser}>
                    <Image
                      source={{ uri: split.user?.profileImage || 'https://placehold.co/32x32' }}
                      style={styles.splitAvatar}
                    />
                    <Text style={styles.splitUserName}>{split.user?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.splitAmount}>
                    <Text style={styles.splitAmountText}>
                      ${(split.amount || 0).toFixed(2)}
                    </Text>
                    <Text style={[
                      styles.splitStatus,
                      { color: split.isPaid ? '#10B981' : '#EF4444' }
                    ]}>
                      {split.isPaid ? 'Paid' : 'Owes'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Your Share */}
        {userSplit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Share</Text>
            <View style={styles.userShareContainer}>
              <View style={styles.userShareRow}>
                <Text style={styles.userShareLabel}>Amount</Text>
                <Text style={styles.userShareAmount}>${userSplit.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.userShareRow}>
                <Text style={styles.userShareLabel}>Status</Text>
                <Text style={[
                  styles.userShareStatus,
                  { color: userSplit.isPaid ? '#10B981' : '#EF4444' }
                ]}>
                  {userSplit.isPaid ? 'Paid' : userPaid ? 'You paid' : 'You owe'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContent}>
            <Text style={styles.dateModalTitle}>Select Date</Text>

            {/* Quick Date Options */}
            <View style={styles.quickDateOptions}>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => handleDateSelect(new Date())}
              >
                <Text style={styles.quickDateText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  handleDateSelect(yesterday);
                }}
              >
                <Text style={styles.quickDateText}>Yesterday</Text>
              </TouchableOpacity>
            </View>

            {/* Current Selection */}
            <View style={styles.currentDateContainer}>
              <Text style={styles.currentDateLabel}>Selected Date:</Text>
              <Text style={styles.currentDateText}>
                {editForm.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>

            {/* Manual Date Input */}
            <View style={styles.manualDateContainer}>
              <Text style={styles.manualDateLabel}>Or enter date manually:</Text>
              <TextInput
                style={styles.manualDateInput}
                placeholder="MM/DD/YYYY"
                value={editForm.date.toLocaleDateString('en-US')}
                onChangeText={(text) => {
                  const date = new Date(text);
                  if (!isNaN(date.getTime())) {
                    setEditForm(prev => ({ ...prev, date }));
                  }
                }}
              />
            </View>

            <View style={styles.dateModalButtons}>
              <TouchableOpacity
                style={[styles.dateModalButton, styles.dateModalCancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.dateModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateModalButton, styles.dateModalConfirmButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.dateModalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      )}
    </SafeAreaView>
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
    padding: 20,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  saveText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.background.primary,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expenseIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[600],
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settleButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editTitleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: 4,
    marginBottom: 8,
  },
  editAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: 4,
  },
  editAmountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[600],
    flex: 1,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[600],
    marginRight: 4,
  },
  editDescriptionInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  descriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  paymentInfo: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  dropdownContainer: {
    minWidth: 120,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
    minWidth: 120,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectedOption: {
    backgroundColor: colors.primary[50],
  },
  optionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.background.tertiary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
  },
  dateText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  paymentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: colors.background.tertiary,
  },
  paymentUserName: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  splitContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  splitUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  splitAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: colors.background.tertiary,
  },
  splitUserName: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  splitAmount: {
    alignItems: 'flex-end',
  },
  splitAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  splitStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitValidation: {
    alignItems: 'flex-end',
  },
  splitValidationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editSplitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitAmountInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  userShareContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  userShareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userShareLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  userShareAmount: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '700',
  },
  userShareStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 320,
    maxWidth: 400,
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  currentDateContainer: {
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  currentDateLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  currentDateText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  manualDateContainer: {
    marginBottom: 24,
  },
  manualDateLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  manualDateInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  dateModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dateModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateModalCancelButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dateModalConfirmButton: {
    backgroundColor: colors.primary[600],
  },
  dateModalCancelText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dateModalConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
  },
});

export default ExpenseDetailScreen;