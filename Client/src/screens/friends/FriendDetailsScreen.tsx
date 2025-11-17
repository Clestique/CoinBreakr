import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { getProfileImageUri } from '../../utils/defaultImage';
import { Friend, friendsService } from '../../services/friends';

interface RouteParams {
  friend: Friend;
}

const FriendDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { friend: initialFriend } = route.params as RouteParams;
  
  const [friend] = useState<Friend>(initialFriend);
  const [loading, setLoading] = useState(false);

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: removeFriend }
      ]
    );
  };

  const removeFriend = async () => {
    try {
      setLoading(true);
      await friendsService.removeFriend(friend._id);
      Alert.alert(
        'Success',
        `${friend.name} has been removed from your friends.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to FriendsList and trigger refresh
              navigation.reset({
                index: 0,
                routes: [{ name: 'FriendsList', params: { refresh: true } }],
              });
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', error.message || 'Unable to remove friend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${friend.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => console.log('Block user') }
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      `Report ${friend.name} for inappropriate behavior?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => console.log('Report user') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background.body} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top - 15 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friend Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Friend Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friend Details</Text>
        <View style={styles.friendHeader}>
          <Image
            source={{ uri: getProfileImageUri(friend.profileImage, 64) }}
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friend.name}</Text>
            <Text style={styles.friendEmail}>{friend.email}</Text>
            {(friend.phone || friend.phoneNumber) && (
              <Text style={styles.friendPhone}>{friend.phone || friend.phoneNumber}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.lastSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity 
          style={[styles.actionItem, loading && styles.disabledAction]} 
          onPress={handleRemoveFriend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size={20} color="#EF4444" />
          ) : (
            <Ionicons name="person-remove" size={20} color="#EF4444" />
          )}
          <Text style={[styles.actionText, { color: '#EF4444' }]}>
            {loading ? 'Removing...' : 'Remove Friend'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleBlockUser}>
          <Ionicons name="ban" size={20} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Block User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionItem, styles.lastActionItem]} onPress={handleReportUser}>
          <Ionicons name="flag" size={20} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Report User</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  section: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastSection: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: colors.background.tertiary,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  friendPhone: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastActionItem: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  disabledAction: {
    opacity: 0.6,
  },
});

export default FriendDetailsScreen;