import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
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
import { ExpenseService } from '../googleServices/expenseService';
import { GroupService, Group } from '../googleServices/groupService';

const categories = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'transport', name: 'Transportation', icon: 'car' },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller' },
  { id: 'shopping', name: 'Shopping', icon: 'bag' },
  { id: 'utilities', name: 'Utilities', icon: 'flash' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical' },
  { id: 'travel', name: 'Travel', icon: 'airplane' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

export default function AddExpenseScreen() {
  const { groupId, groupName, friendId, friendName } = useLocalSearchParams<{
    groupId?: string;
    groupName?: string;
    friendId?: string;
    friendName?: string;
  }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [splitEqually, setSplitEqually] = useState(true);
  const [customSplits, setCustomSplits] = useState<{ [userId: string]: string }>({});

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
      const groupData = await GroupService.getGroupById(groupId);
      setGroup(groupData);
      
      // Initialize custom splits for group members
      const initialSplits: { [userId: string]: string } = {};
      groupData.members.forEach(member => {
        initialSplits[member.user._id] = '0';
      });
      setCustomSplits(initialSplits);
    } catch (error) {
      console.error('Load group data error:', error);
      Alert.alert('Error', 'Failed to load group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = () => {
    return 'current_user_id'; // Should be retrieved from auth context
  };

  const calculateEqualSplit = () => {
    if (!amount || !group) return 0;
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount)) return 0;
    return totalAmount / group.members.length;
  };

  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const totalAmount = parseFloat(amount);

    // Prepare split data
    let splitWith: Array<{ user: string; amount: number }> = [];

    if (groupId && group) {
      // Group expense
      if (splitEqually) {
        const equalAmount = totalAmount / group.members.length;
        splitWith = group.members.map(member => ({
          user: member.user._id,
          amount: equalAmount,
        }));
      } else {
        // Custom splits
        splitWith = group.members.map(member => ({
          user: member.user._id,
          amount: parseFloat(customSplits[member.user._id] || '0'),
        }));

        // Validate custom splits
        const totalSplit = splitWith.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - totalAmount) > 0.01) {
          Alert.alert('Error', 'Split amounts must equal the total expense amount');
          return;
        }
      }
    } else if (friendId) {
      // Friend expense (split equally between user and friend)
      const equalAmount = totalAmount / 2;
      const currentUserId = getCurrentUserId();
      splitWith = [
        { user: currentUserId, amount: equalAmount },
        { user: friendId, amount: equalAmount },
      ];
    }

    setSubmitting(true);
    try {
      await ExpenseService.createExpense({
        description: description.trim(),
        amount: totalAmount,
        currency: 'USD',
        category: selectedCategory,
        splitWith,
        groupId: groupId || undefined,
      });

      Alert.alert('Success', 'Expense added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Create expense error:', error);
      Alert.alert('Error', error.message || 'Failed to create expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCustomSplit = (userId: string, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: value,
    }));
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
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </>
    );
  }

  const currentUserId = getCurrentUserId();
  const equalSplitAmount = calculateEqualSplit();

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
            <Text style={styles.headerTitle}>Add Expense</Text>
            <Text style={styles.headerSubtitle}>
              {groupId ? `To ${groupName}` : `With ${friendName}`}
            </Text>
          </View>
          <Pressable
            style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            )}
          </Pressable>
        </Animated.View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
            {/* Description Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What was this expense for?"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#999"
                autoFocus
              />
            </View>

            {/* Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category.id && styles.selectedCategoryItem,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={selectedCategory === category.id ? '#ffffff' : '#667eea'}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.id && styles.selectedCategoryText,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Split Options (only for group expenses) */}
            {groupId && group && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Split Options</Text>
                
                <View style={styles.splitOptionsContainer}>
                  <Pressable
                    style={[
                      styles.splitOption,
                      splitEqually && styles.selectedSplitOption,
                    ]}
                    onPress={() => setSplitEqually(true)}
                  >
                    <Ionicons
                      name="people"
                      size={20}
                      color={splitEqually ? '#ffffff' : '#667eea'}
                    />
                    <Text
                      style={[
                        styles.splitOptionText,
                        splitEqually && styles.selectedSplitOptionText,
                      ]}
                    >
                      Split Equally
                    </Text>
                    {splitEqually && amount && (
                      <Text style={styles.splitAmountText}>
                        ${equalSplitAmount.toFixed(2)} each
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[
                      styles.splitOption,
                      !splitEqually && styles.selectedSplitOption,
                    ]}
                    onPress={() => setSplitEqually(false)}
                  >
                    <Ionicons
                      name="calculator"
                      size={20}
                      color={!splitEqually ? '#ffffff' : '#667eea'}
                    />
                    <Text
                      style={[
                        styles.splitOptionText,
                        !splitEqually && styles.selectedSplitOptionText,
                      ]}
                    >
                      Custom Split
                    </Text>
                  </Pressable>
                </View>

                {/* Custom Split Details */}
                {!splitEqually && (
                  <View style={styles.customSplitContainer}>
                    <Text style={styles.customSplitTitle}>Enter amount for each member:</Text>
                    {group.members.map((member) => (
                      <View key={member.user._id} style={styles.customSplitItem}>
                        <View style={styles.memberInfo}>
                          <LinearGradient
                            colors={member.user._id === currentUserId ? ['#4CAF50', '#45a049'] : ['#667eea', '#764ba2']}
                            style={styles.memberAvatar}
                          >
                            <Text style={styles.memberAvatarText}>
                              {member.user.name.charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                          <Text style={styles.memberName}>
                            {member.user._id === currentUserId ? 'You' : member.user.name}
                          </Text>
                        </View>
                        <View style={styles.customSplitInputContainer}>
                          <Text style={styles.currencySymbol}>$</Text>
                          <TextInput
                            style={styles.customSplitInput}
                            placeholder="0.00"
                            value={customSplits[member.user._id] || ''}
                            onChangeText={(value) => updateCustomSplit(member.user._id, value)}
                            keyboardType="decimal-pad"
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    paddingVertical: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  selectedCategoryItem: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  splitOptionsContainer: {
    gap: 12,
  },
  splitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 12,
  },
  selectedSplitOption: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  splitOptionText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
    flex: 1,
  },
  selectedSplitOptionText: {
    color: '#ffffff',
  },
  splitAmountText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  customSplitContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  customSplitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  customSplitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  memberName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  customSplitInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 80,
  },
  customSplitInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 8,
    textAlign: 'right',
  },
});
