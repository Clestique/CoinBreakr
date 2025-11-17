import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { getProfileImageUri } from '../../utils/defaultImage';
import { Friend, friendsService } from '../../services/friends';
import { expensesService } from '../../services/expenses';
import { useAuth } from '../../hooks/useAuth';

interface RouteParams {
    selectedFriend?: Friend;
    group?: any; // Group from navigation params
}

interface SelectedParticipant {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    type: 'friend' | 'user';
}

interface SplitData {
    userId: string;
    amount: number;
    percentage?: number;
    amountText?: string; // Store the raw text input
    percentageText?: string; // Store the raw text input
}

type SplitType = 'equal' | 'percentage' | 'unequal';

const AddExpenseScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { userId } = useAuth();
    const { selectedFriend, group } = (route.params as RouteParams) || {};

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(userId || '');
    const [splitType, setSplitType] = useState<SplitType>('equal');

    // Participants state
    const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [showFriendSearch, setShowFriendSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Split data
    const [splitData, setSplitData] = useState<SplitData[]>([]);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);

    // Initialize data on mount
    useEffect(() => {
        loadFriends();
        initializeParticipants();
    }, [userId]);

    // Only handle split calculations
    useEffect(() => {
        if (selectedParticipants.length > 0 && amount) {
            calculateSplit();
        }
    }, [selectedParticipants, amount, splitType]);

    const loadFriends = async () => {
        try {
            setLoadingFriends(true);
            const friendsData = await friendsService.getFriends();
            setFriends(friendsData.friends || []);
        } catch (error) {
            console.error('Error loading friends:', error);
        } finally {
            setLoadingFriends(false);
        }
    };

    const initializeParticipants = () => {
        const participants: SelectedParticipant[] = [];

        // Always add current user (but don't show as chip)
        if (userId) {
            participants.push({
                _id: userId,
                name: 'You',
                email: '', // We don't have user email from auth
                profileImage: undefined,
                type: 'user',
            });
        }

        // If group is selected, add all group members
        if (group && group.members) {
            group.members.forEach((member: any) => {
                // Skip if it's the current user (already added above)
                if (member.user._id !== userId) {
                    participants.push({
                        _id: member.user._id,
                        name: member.user.name,
                        email: member.user.email,
                        profileImage: member.user.profileImage,
                        type: 'friend',
                    });
                }
            });
        }
        // Add pre-selected friend if any (only if no group)
        else if (selectedFriend) {
            participants.push({
                _id: selectedFriend._id,
                name: selectedFriend.name,
                email: selectedFriend.email,
                profileImage: selectedFriend.profileImage,
                type: 'friend',
            });
        }

        setSelectedParticipants(participants);

        // Set paidBy to current user if available, otherwise first participant
        if (participants.length > 0 && userId) {
            const currentUser = participants.find(p => p._id === userId);
            setPaidBy(currentUser ? userId : participants[0]._id);
        }
    };

    const calculateSplit = () => {
        const totalAmount = parseFloat(amount) || 0;
        const participantCount = selectedParticipants.length;

        if (totalAmount <= 0 || participantCount === 0) {
            setSplitData([]);
            return;
        }

        const newSplitData: SplitData[] = [];

        switch (splitType) {
            case 'equal':
                const equalAmount = totalAmount / participantCount;
                selectedParticipants.forEach(participant => {
                    newSplitData.push({
                        userId: participant._id,
                        amount: equalAmount,
                        percentage: (100 / participantCount),
                    });
                });
                break;

            case 'percentage':
                // Initialize with empty percentages for user to fill
                selectedParticipants.forEach(participant => {
                    newSplitData.push({
                        userId: participant._id,
                        amount: 0,
                        percentage: 0,
                    });
                });
                break;

            case 'unequal':
                // Initialize with empty amounts for user to fill
                selectedParticipants.forEach(participant => {
                    newSplitData.push({
                        userId: participant._id,
                        amount: 0,
                    });
                });
                break;
        }

        setSplitData(newSplitData);
    };

    const addParticipant = (friend: Friend) => {
        const isAlreadySelected = selectedParticipants.some(p => p._id === friend._id);
        if (isAlreadySelected) return;

        // For groups, don't allow adding individual friends
        if (group) {
            Alert.alert('Group Selected', 'You cannot add individual friends when a group is selected.');
            return;
        }

        const newParticipant: SelectedParticipant = {
            _id: friend._id,
            name: friend.name,
            email: friend.email,
            profileImage: friend.profileImage,
            type: 'friend',
        };

        setSelectedParticipants(prev => [...prev, newParticipant]);
        setShowFriendSearch(false);
        setSearchQuery('');
    };

    const removeParticipant = (participantId: string) => {
        // Don't allow removing current user
        if (participantId === userId) {
            Alert.alert('Cannot Remove', 'You cannot remove yourself from the expense.');
            return;
        }

        // Don't allow removing participants when in group mode
        if (group) {
            Alert.alert('Group Expense', 'You cannot remove group members from a group expense.');
            return;
        }

        // If removing the person who paid, reset to current user
        if (participantId === paidBy && userId) {
            setPaidBy(userId);
        }

        setSelectedParticipants(prev => prev.filter(p => p._id !== participantId));
    };

    const updateSplitAmount = (userId: string, newAmount: string) => {
        // Store both the text and numeric value
        const amount = newAmount === '' ? 0 : parseFloat(newAmount) || 0;
        setSplitData(prev => prev.map(split =>
            split.userId === userId ? { ...split, amount, amountText: newAmount } : split
        ));
    };

    const updateSplitPercentage = (userId: string, newPercentage: string) => {
        const percentage = newPercentage === '' ? 0 : parseFloat(newPercentage) || 0;
        const totalAmount = parseFloat(amount) || 0;
        const newAmount = (totalAmount * percentage) / 100;

        setSplitData(prev => prev.map(split =>
            split.userId === userId ? { ...split, percentage, amount: newAmount, percentageText: newPercentage } : split
        ));
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter an expense title.');
            return false;
        }

        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return false;
        }

        if (selectedParticipants.length < 2) {
            Alert.alert('Error', 'Please add at least one other person to split with.');
            return false;
        }

        // Validate split totals for percentage and unequal
        if (splitType !== 'equal') {
            const totalSplitAmount = splitData.reduce((sum, split) => sum + split.amount, 0);
            const expenseAmount = parseFloat(amount);

            // Check if any split amounts are empty (0) for unequal/percentage
            const hasEmptyAmounts = splitData.some(split => split.amount === 0);
            if (hasEmptyAmounts) {
                Alert.alert('Error', `Please enter ${splitType === 'percentage' ? 'percentages' : 'amounts'} for all participants.`);
                return false;
            }

            if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
                Alert.alert('Error', 'Split amounts do not add up to the total expense amount.');
                return false;
            }

            if (splitType === 'percentage') {
                const totalPercentage = splitData.reduce((sum, split) => sum + (split.percentage || 0), 0);
                if (Math.abs(totalPercentage - 100) > 0.01) {
                    Alert.alert('Error', 'Split percentages must add up to 100%.');
                    return false;
                }
            }
        }

        return true;
    };

    const handleCreateExpense = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            // Ensure current user is always included in the split
            const splitWithData = splitData.map(split => ({
                user: split.userId,
                amount: split.amount,
            }));

            // Prepare expense data with all required fields
            const expenseData: any = {
                description: title.trim(), // Backend expects 'description' as the main field
                amount: parseFloat(amount),
                currency: 'USD', // Add currency field
                date: new Date().toISOString(),
                splitWith: splitWithData,
            };

            // Only send paidBy if it's different from current user
            if (paidBy && paidBy !== userId) {
                expenseData.paidBy = paidBy;
            }

            // Add optional fields
            if (description.trim()) {
                expenseData.notes = description.trim(); // Some backends expect 'notes' for additional description
            }

            // Add groupId if this is a group expense
            if (group && group._id) {
                expenseData.groupId = group._id;
            }

            await expensesService.createExpense(expenseData);

            Alert.alert(
                'Success',
                'Expense created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error creating expense:', error);
            Alert.alert('Error', error.message || 'Failed to create expense. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends.filter(friend => {
        // Filter out already selected friends
        const isAlreadySelected = selectedParticipants.some(p => p._id === friend._id);
        if (isAlreadySelected) return false;

        // Filter by search query
        return friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            friend.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const getPaidByName = () => {
        const payer = selectedParticipants.find(p => p._id === paidBy);
        if (payer) {
            return payer.name;
        }
        // Fallback: if paidBy matches userId, return 'You'
        if (paidBy === userId) {
            return 'You';
        }
        return 'Unknown';
    };

    const formatAmount = (amount: number, preserveDecimals: boolean = false): string => {
        if (preserveDecimals) {
            // For user input, preserve the format they entered
            return amount.toString();
        }
        // For display, remove unnecessary decimals
        return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    };

    const calculateSplitDifference = (): number => {
        const totalAmount = parseFloat(amount) || 0;
        const totalSplitAmount = splitData.reduce((sum, split) => sum + split.amount, 0);
        return totalAmount - totalSplitAmount;
    };

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
                <Text style={styles.headerTitle}>Add Expense</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Overlay to close dropdown */}
            {showPaidByDropdown && (
                <TouchableOpacity
                    style={styles.overlay}
                    onPress={() => setShowPaidByDropdown(false)}
                    activeOpacity={1}
                />
            )}

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Participants Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {group ? `Group: ${group.name}` : `With you and ${selectedParticipants.filter(p => p.type === 'friend').map(p => p.name).join(', ') || 'others'}`}
                    </Text>

                    {/* Selected Participants - Only show friends, not current user */}
                    <View style={styles.participantsContainer}>
                        {selectedParticipants
                            .filter(participant => participant.type === 'friend')
                            .map((participant) => (
                                <View key={participant._id} style={styles.participantChip}>
                                    <Image
                                        source={{ uri: getProfileImageUri(participant.profileImage, 24) }}
                                        style={styles.participantAvatar}
                                    />
                                    <Text style={styles.participantName}>{participant.name}</Text>
                                    {/* Only show remove button if not in group mode */}
                                    {!group && (
                                        <TouchableOpacity
                                            onPress={() => removeParticipant(participant._id)}
                                            style={styles.removeButton}
                                        >
                                            <Ionicons name="close" size={16} color={colors.text.tertiary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                        {/* Add Friend Button - Only show if not in group mode */}
                        {!group && (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setShowFriendSearch(true)}
                            >
                                <Ionicons name="add" size={20} color={colors.primary[600]} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Friend Search Modal - Only show if not in group mode */}
                    {showFriendSearch && !group && (
                        <View style={styles.searchContainer}>
                            <View style={styles.searchHeader}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search friends..."
                                    placeholderTextColor={colors.text.quaternary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowFriendSearch(false);
                                        setSearchQuery('');
                                    }}
                                    style={styles.searchCloseButton}
                                >
                                    <Ionicons name="close" size={20} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.friendsList} keyboardShouldPersistTaps="handled">
                                {loadingFriends ? (
                                    <ActivityIndicator size="small" color={colors.primary[600]} style={styles.loadingIndicator} />
                                ) : (
                                    filteredFriends.map((friend) => (
                                        <TouchableOpacity
                                            key={friend._id}
                                            style={styles.friendItem}
                                            onPress={() => addParticipant(friend)}
                                        >
                                            <Image
                                                source={{ uri: getProfileImageUri(friend.profileImage, 40) }}
                                                style={styles.friendAvatar}
                                            />
                                            <View style={styles.friendInfo}>
                                                <Text style={styles.friendName}>{friend.name}</Text>
                                                <Text style={styles.friendEmail}>{friend.email}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Expense Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Expense Details</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Title *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter expense title"
                            placeholderTextColor={colors.text.quaternary}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder="Add a description (optional)"
                            placeholderTextColor={colors.text.quaternary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            maxLength={500}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Amount *</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0.00"
                                placeholderTextColor={colors.text.quaternary}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    {/* Paid By Dropdown */}
                    <View style={[styles.inputContainer, { position: 'relative', zIndex: showPaidByDropdown ? 1000 : 1 }]}>
                        <Text style={styles.inputLabel}>Paid By</Text>
                        <TouchableOpacity
                            style={styles.dropdownContainer}
                            onPress={() => setShowPaidByDropdown(!showPaidByDropdown)}
                        >
                            <Text style={styles.dropdownText}>{getPaidByName()}</Text>
                            <Ionicons
                                name={showPaidByDropdown ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={colors.text.tertiary}
                            />
                        </TouchableOpacity>

                        {/* Dropdown options */}
                        {showPaidByDropdown && (
                            <View style={styles.dropdownOptions}>
                                {selectedParticipants.map((participant) => (
                                    <TouchableOpacity
                                        key={participant._id}
                                        style={[
                                            styles.dropdownOption,
                                            paidBy === participant._id && styles.selectedOption
                                        ]}
                                        onPress={() => {
                                            setPaidBy(participant._id);
                                            setShowPaidByDropdown(false);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: getProfileImageUri(participant.profileImage, 24) }}
                                            style={styles.optionAvatar}
                                        />
                                        <Text style={styles.optionText}>{participant.name}</Text>
                                        {paidBy === participant._id && (
                                            <Ionicons name="checkmark" size={16} color={colors.primary[600]} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Split Type Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Split Type</Text>

                    <View style={styles.splitTypeContainer}>
                        <TouchableOpacity
                            style={[styles.splitTypeButton, splitType === 'equal' && styles.activeSplitType]}
                            onPress={() => setSplitType('equal')}
                        >
                            <Text style={[styles.splitTypeText, splitType === 'equal' && styles.activeSplitTypeText]}>
                                Split Equally
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.splitTypeButton, splitType === 'percentage' && styles.activeSplitType]}
                            onPress={() => setSplitType('percentage')}
                        >
                            <Text style={[styles.splitTypeText, splitType === 'percentage' && styles.activeSplitTypeText]}>
                                By Percentage
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.splitTypeButton, splitType === 'unequal' && styles.activeSplitType]}
                            onPress={() => setSplitType('unequal')}
                        >
                            <Text style={[styles.splitTypeText, splitType === 'unequal' && styles.activeSplitTypeText]}>
                                Unequal Amounts
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Split Details - Show when amount and participants are present */}
                    {selectedParticipants.length > 0 && amount && splitData.length > 0 && (
                        <View style={styles.splitDetailsContainer}>
                            <View style={styles.splitDetailsHeader}>
                                <Text style={styles.splitDetailsTitle}>Split Breakdown</Text>
                                {splitType !== 'equal' && (
                                    <View style={styles.splitCalculation}>
                                        <Text style={styles.splitCalculationText}>
                                            Remaining: ${formatAmount(Math.abs(calculateSplitDifference()))}
                                            {calculateSplitDifference() !== 0 && (
                                                <Text style={[styles.splitCalculationStatus,
                                                calculateSplitDifference() > 0 ? styles.splitUnder : styles.splitOver]}>
                                                    {calculateSplitDifference() > 0 ? ' (under)' : ' (over)'}
                                                </Text>
                                            )}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {splitData.map((split) => {
                                const participant = selectedParticipants.find(p => p._id === split.userId);
                                if (!participant) return null;

                                return (
                                    <View key={split.userId} style={styles.splitItem}>
                                        <View style={styles.splitParticipant}>
                                            <Image
                                                source={{ uri: getProfileImageUri(participant.profileImage, 32) }}
                                                style={styles.splitAvatar}
                                            />
                                            <Text style={styles.splitName}>{participant.name}</Text>
                                        </View>

                                        <View style={styles.splitInputs}>
                                            {splitType === 'percentage' ? (
                                                <TextInput
                                                    style={styles.splitInput}
                                                    value={split.percentageText !== undefined ? split.percentageText : (split.percentage ? formatAmount(split.percentage) : '')}
                                                    onChangeText={(value) => updateSplitPercentage(split.userId, value)}
                                                    keyboardType="decimal-pad"
                                                    placeholder="0"
                                                    placeholderTextColor={colors.text.quaternary}
                                                />
                                            ) : (
                                                <TextInput
                                                    style={[styles.splitInput, splitType === 'equal' && styles.disabledInput]}
                                                    value={splitType === 'equal' ? formatAmount(split.amount) : (split.amountText !== undefined ? split.amountText : (split.amount > 0 ? formatAmount(split.amount) : ''))}
                                                    onChangeText={(value) => updateSplitAmount(split.userId, value)}
                                                    keyboardType="decimal-pad"
                                                    editable={splitType !== 'equal'}
                                                    placeholder="0"
                                                    placeholderTextColor={colors.text.quaternary}
                                                />
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Create Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreateExpense}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Expense</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.body,
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
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        marginBottom: -85
    },
    scrollContent: {
        paddingBottom: 80, // Space for bottom button
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    section: {
        backgroundColor: colors.background.primary,
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 16,
    },

    // Participants styles
    participantsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    participantChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    participantAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: colors.background.tertiary,
    },
    participantName: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.primary,
        marginRight: 4,
    },
    removeButton: {
        padding: 2,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary[50],
        borderWidth: 1,
        borderColor: colors.primary[200],
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Search styles
    searchContainer: {
        marginTop: 16,
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        maxHeight: 300,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text.primary,
    },
    searchCloseButton: {
        padding: 4,
    },
    friendsList: {
        maxHeight: 200,
    },
    loadingIndicator: {
        padding: 20,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    friendAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: colors.background.tertiary,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.primary,
        marginBottom: 2,
    },
    friendEmail: {
        fontSize: 14,
        color: colors.text.tertiary,
    },

    // Input styles
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text.primary,
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: colors.border.medium,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text.primary,
        backgroundColor: colors.background.primary,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.medium,
        borderRadius: 8,
        backgroundColor: colors.background.primary,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary[600],
        paddingLeft: 16,
        paddingRight: 8,
    },
    amountInput: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text.primary,
    },

    // Dropdown styles
    dropdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border.medium,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.background.primary,
    },
    dropdownText: {
        fontSize: 16,
        color: colors.text.primary,
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
        fontSize: 16,
        color: colors.text.primary,
    },

    // Split type styles
    splitTypeContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background.secondary,
        borderRadius: 8,
        padding: 4,
    },
    splitTypeButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeSplitType: {
        backgroundColor: colors.primary[600],
    },
    splitTypeText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.text.secondary,
        textAlign: 'center',
    },
    activeSplitTypeText: {
        color: '#FFFFFF',
    },

    // Split details styles
    splitDetailsContainer: {
        marginTop: 20,
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: 16,
    },
    splitDetailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    splitDetailsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    splitCalculation: {
        alignItems: 'flex-end',
    },
    splitCalculationText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.text.secondary,
    },
    splitCalculationStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    splitUnder: {
        color: colors.warning?.[600] || '#f59e0b',
    },
    splitOver: {
        color: colors.error?.[600] || '#dc2626',
    },
    splitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    splitParticipant: {
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
    splitName: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.text.primary,
    },
    splitInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    splitInput: {
        borderWidth: 1,
        borderColor: colors.border.medium,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: colors.text.primary,
        backgroundColor: colors.background.primary,
        minWidth: 60,
        textAlign: 'center',
    },
    disabledInput: {
        backgroundColor: colors.background.tertiary,
        color: colors.text.tertiary,
    },

    // Bottom button
    bottomContainer: {
        backgroundColor: colors.background.primary,
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginBottom: -17
    },
    createButton: {
        backgroundColor: colors.primary[600],
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddExpenseScreen;