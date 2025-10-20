import React, { useState } from 'react';
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

  const removeFriend = (friendId: string) => {
    setPendingFriends(pendingFriends.filter(f => f.id !== friendId));
  };

  const editFriend = (friend: LocalPendingFriend) => {
    setEditingFriend(friend);
    setShowEditModal(true);
  };

  const handleEditSubmit = (updatedData: { name: string; email?: string; phoneNumber?: string; countryCode?: string }) => {
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
      // Validate and prepare all friends data for the API
      const friendsData = pendingFriends.map(friend => {
        // Validate that friend has required data
        if (!friend.name || (!friend.email && !friend.phoneNumber)) {
          throw new Error(`Friend "${friend.name || 'Unknown'}" must have a name and either email or phone number`);
        }

        if (friend.type === 'appUser') {
          // For app users, send user ID along with required name and contact info
          const appUserData = {
            userId: friend.id.replace('user-', ''),
            name: friend.name,
            email: friend.email || undefined,
            phoneNumber: friend.phoneNumber || undefined,
            countryCode: friend.countryCode || undefined,
            type: 'appUser'
          };
          console.log('App user data being sent:', appUserData);
          return appUserData;
        } else {
          // For manual entries and contacts, send full data
          const contactData = {
            name: friend.name,
            email: friend.email || undefined,
            phoneNumber: friend.phoneNumber || undefined,
            countryCode: friend.countryCode || undefined,
            type: friend.type
          };
          console.log('Contact/manual data being sent:', contactData);
          return contactData;
        }
      });

      console.log('All friends data being sent to API:', friendsData);

      // Send all friends data to the API
      const response = await friendsService.addFriend(friendsData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add friends');
      }

      // Show success message
      Alert.alert(
        'Success!',
        `${pendingFriends.length} friend${pendingFriends.length > 1 ? 's' : ''} added successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // If only one friend was added, offer to send SMS
              if (pendingFriends.length === 1) {
                showSMSOption(pendingFriends[0]);
              } else {
                // For multiple friends, offer to send automated messages
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

  const showSMSOption = (friend: LocalPendingFriend) => {
    if (!friend.phoneNumber) {
      navigation.navigate('Main', { screen: 'Friends' });
      return;
    }

    Alert.alert(
      'Send Invitation',
      `Would you like to send an invitation message to ${friend.name}?`,
      [
        { text: 'Skip', onPress: () => navigation.navigate('Main', { screen: 'Friends' }) },
        { text: 'Send SMS', onPress: () => sendSMS(friend) }
      ]
    );
  };

  const sendSMS = (friend: LocalPendingFriend) => {
    const message = `Hi ${friend.name}! I've added you to CoinBreakr, a great app for splitting expenses with friends. Download it to easily manage shared costs: https://coinbreakr.app`;

    const url = `sms:${friend.phoneNumber}?body=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'SMS not supported on this device');
        }
      })
      .catch((error) => {
        console.error('Error opening SMS:', error);
        Alert.alert('Error', 'Failed to open SMS app');
      })
      .finally(() => {
        navigation.navigate('Main', { screen: 'Friends' });
      });
  };

  const sendAutomatedMessages = async () => {
    const friendsWithPhones = pendingFriends.filter(f => f.phoneNumber && f.type !== 'appUser');

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
          onPress: () => {
            // Send SMS to all friends with phone numbers
            friendsWithPhones.forEach((friend, index) => {
              setTimeout(() => sendSMS(friend), index * 1000); // Stagger SMS sends
            });
          }
        }
      ]
    );
  };

  const renderFriend = (friend: LocalPendingFriend) => (
    <View key={friend.id} style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        {friend.profileImage ? (
          <Image source={{ uri: friend.profileImage }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={24} color={colors.text.tertiary} />
        )}
      </View>

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={styles.friendDetail}>
          {friend.email || friend.phoneNumber || 'Manual entry'}
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Friends</Text>
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
    backgroundColor: colors.background.secondary,
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
    backgroundColor: colors.background.secondary,
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