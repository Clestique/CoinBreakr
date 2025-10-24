import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { friendsService } from '../../services/friends';
import { LocalPendingFriend } from './AddFriendScreen';
import AddPersonModal from '../../components/AddPersonModal';

const ReviewFriendsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [pendingFriends, setPendingFriends] = useState<LocalPendingFriend[]>(
    route.params?.pendingFriends || []
  );
  const [isAdding, setIsAdding] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFriend, setEditingFriend] = useState<LocalPendingFriend | null>(null);




  const isValidPhoneNumber = (phoneNumber: string): boolean => {
    // Remove US country code and any formatting
    const cleanPhone = phoneNumber.replace(/^\+1/, '').replace(/[\s\-\(\)]/g, '');
    // Check if it's exactly 10 digits
    return /^\d{10}$/.test(cleanPhone);
  };

  const extractPhoneNumber = (phoneNumber: string): string => {
    // Remove US country code and return just the 10-digit number
    return phoneNumber.replace(/^\+1/, '').replace(/[\s\-\(\)]/g, '');
  };

  const removeFriend = (friendId: string) => {
    setPendingFriends(pendingFriends.filter(f => f.id !== friendId));
  };

  const editFriend = (friend: LocalPendingFriend) => {
    setEditingFriend(friend);
    setShowEditModal(true);
  };

  const handleEditSubmit = (updatedData: { name: string; email?: string; phoneNumber?: string }) => {
    if (editingFriend) {
      setPendingFriends(pendingFriends.map(f =>
        f.id === editingFriend.id
          ? { ...f, ...updatedData }
          : f
      ));
    }
    setShowEditModal(false);
    setEditingFriend(null);
  };

  const addFriends = async () => {
    if (pendingFriends.length === 0) {
      Alert.alert('No Friends', 'No friends to add.');
      return;
    }



    setIsAdding(true);
    try {
      // Prepare all friends data for the API
      const friendsData = pendingFriends.map(friend => {
        if (friend.type === 'appUser') {
          // For app users, send user ID along with name and contact info
          const appUserData = {
            userId: friend.id.replace('user-', ''),
            name: friend.name,
            email: friend.email || undefined,
            phoneNumber: friend.phoneNumber || undefined,
            type: 'appUser'
          };
          console.log('App user data being sent:', appUserData);
          return appUserData;
        } else {
          // For manual entries and contacts, send name, email, and phoneNumber
          const contactData = {
            name: friend.name,
            email: friend.email || undefined,
            phoneNumber: friend.phoneNumber || undefined,
            type: friend.type
          };
          console.log('Contact/manual data being sent:', contactData);
          return contactData;
        }
      });

      console.log('All friends data being sent to API:', friendsData);

      // Send all friends data to the API
      await friendsService.addFriend(friendsData);

      // Show success message
      Alert.alert(
        'Success!',
        `${pendingFriends.length} friend${pendingFriends.length > 1 ? 's' : ''} added successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Friends added successfully, processing next steps...');
              // If only one friend was added, offer to send SMS
              if (pendingFriends.length === 1) {
                const friend = pendingFriends[0];
                console.log('Single friend added:', friend.name);
                if (friend.phoneNumber && friend.type !== 'appUser') {
                  showSMSOption(friend);
                } else {
                  console.log('No phone number or is app user, navigating directly');
                  navigation.navigate('Main', { screen: 'Friends' });
                }
              } else {
                // For multiple friends, offer to send automated messages
                console.log('Multiple friends added, checking for SMS options');
                sendAutomatedMessages();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error adding friends:', error);
      Alert.alert('Error', 'Failed to add friends. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const showSMSOption = async (friend: LocalPendingFriend) => {
    console.log('showSMSOption called for friend:', friend.name, 'Phone:', friend.phoneNumber);

    if (!friend.phoneNumber) {
      console.log('No phone number, navigating directly to Friends screen');
      navigation.navigate('Main', { screen: 'Friends' });
      return;
    }

    // Validate phone number before showing SMS option
    if (!isValidPhoneNumber(friend.phoneNumber)) {
      console.log('Invalid phone number, navigating directly to Friends screen');
      navigation.navigate('Main', { screen: 'Friends' });
      return;
    }

    console.log('Showing SMS option alert');
    Alert.alert(
      'Send Invitation',
      `Would you like to send an invitation message to ${friend.name}?`,
      [
        {
          text: 'Skip',
          onPress: () => {
            console.log('User skipped SMS, navigating to Friends screen');
            navigation.navigate('Main', { screen: 'Friends' });
          }
        },
        {
          text: 'Send SMS',
          onPress: () => {
            console.log('User chose to send SMS');
            sendSMS(friend, true);
          }
        }
      ]
    );
  };

  const sendSMS = async (friend: LocalPendingFriend, shouldNavigate: boolean = true) => {
    console.log('Attempting to send SMS to:', friend.phoneNumber);

    const message = `Hi ${friend.name}! I've added you to CoinBreakr, a great app for splitting expenses with friends. Download it to easily manage shared costs: https://coinbreakr.app`;

    // Different URL formats for different platforms
    let url: string;
    if (Platform.OS === 'ios') {
      url = `sms:${friend.phoneNumber}&body=${encodeURIComponent(message)}`;
    } else {
      url = `sms:${friend.phoneNumber}?body=${encodeURIComponent(message)}`;
    }

    console.log('SMS URL:', url);

    try {
      const supported = await Linking.canOpenURL(url);
      console.log('SMS supported:', supported);

      if (supported) {
        console.log('Opening SMS app...');
        await Linking.openURL(url);
        console.log('SMS app opened successfully');
      } else {
        console.log('SMS not supported on this device');
        Alert.alert('Error', 'SMS not supported on this device');
      }
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert('Error', `Failed to open SMS app: ${error}`);
    }

    // Add a small delay before navigation to ensure SMS app has time to open
    if (shouldNavigate) {
      setTimeout(() => {
        console.log('Navigating to Friends screen...');
        navigation.navigate('Main', { screen: 'Friends' });
      }, 1000);
    }
  };

  const sendAutomatedMessages = async () => {
    const friendsWithPhones = pendingFriends.filter(f => f.phoneNumber && f.type !== 'appUser' && isValidPhoneNumber(f.phoneNumber));

    if (friendsWithPhones.length === 0) {
      navigation.navigate('Main', { screen: 'Friends' });
      return;
    }

    Alert.alert(
      'Send Invitations',
      `Send invitation messages to ${friendsWithPhones.length} friend${friendsWithPhones.length > 1 ? 's' : ''}?`,
      [
        { text: 'Skip', onPress: () => navigation.navigate('Main', { screen: 'Friends' }) },
        {
          text: 'Send All',
          onPress: async () => {
            console.log('Sending SMS to multiple friends:', friendsWithPhones.length);
            try {
              // Send SMS to all friends with phone numbers (without navigation for each)
              for (let i = 0; i < friendsWithPhones.length; i++) {
                const friend = friendsWithPhones[i];
                console.log(`Sending SMS ${i + 1}/${friendsWithPhones.length} to ${friend.name}`);
                await sendSMS(friend, false); // Don't navigate for each SMS
                // Add a small delay between SMS sends to avoid overwhelming the system
                if (i < friendsWithPhones.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } catch (error) {
              console.error('Error in bulk SMS sending:', error);
            } finally {
              // Navigate to Friends screen after all SMS are sent (or if there's an error)
              console.log('Bulk SMS complete, navigating to Friends screen');
              setTimeout(() => {
                navigation.navigate('Main', { screen: 'Friends' });
              }, 1000);
            }
          }
        }
      ]
    );
  };

  const renderFriend = (friend: LocalPendingFriend) => {
    return (
      <View key={friend.id} style={styles.friendItem}>
        <View style={styles.friendAvatar}>
          {friend.profileImage ? (
            <Image source={{ uri: friend.profileImage }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={colors.text.tertiary} />
          )}
        </View>

        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.name || 'No name'}</Text>
          <Text style={styles.friendDetail}>
            {friend.email || friend.phoneNumber || 'No contact info'}
          </Text>
          <Text style={styles.friendType}>
            {friend.type === 'appUser' ? 'CoinBreakr User' :
              friend.type === 'contact' ? 'From Contacts' : 'Manual Entry'}
          </Text>
        </View>

        <View style={styles.friendActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => editFriend(friend)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => removeFriend(friend.id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 2 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Review Friends</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {pendingFriends.length} friend{pendingFriends.length !== 1 ? 's' : ''} ready to add
            </Text>

          </View>

          {pendingFriends.length > 0 ? (
            <View style={styles.friendsList}>
              {pendingFriends.map(renderFriend)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No friends selected</Text>
              <Text style={styles.emptyText}>
                Go back to add some friends to your list
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Add More</Text>
          </TouchableOpacity>

          {pendingFriends.length > 0 && (
            <TouchableOpacity
              style={[styles.addButton, isAdding && styles.disabledButton]}
              onPress={addFriends}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>
                  Add Friends ({pendingFriends.length})
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Edit Modal */}
        {editingFriend && (
          <AddPersonModal
            visible={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingFriend(null);
            }}
            onSubmit={handleEditSubmit}
            initialQuery={editingFriend.name}
            initialData={{
              name: editingFriend.name,
              email: editingFriend.email,
              phoneNumber: editingFriend.phoneNumber
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.body,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: colors.background.body,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
  },
  summary: {
    backgroundColor: colors.primary[25],
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[700],
    textAlign: 'center',
  },
  friendsList: {
    gap: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.gray[900],
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  friendDetail: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  friendType: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '500',
  },

  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: colors.background.body,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  addButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    shadowColor: colors.primary[600],
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReviewFriendsScreen;