import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';

const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 11 }]}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            // TODO: Implement add group functionality
          }}
        >
          <Ionicons name="add-outline" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <SectionCard title="Your Groups">
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Groups Yet</Text>
            <Text style={styles.emptyText}>
              This is a dummy groups screen. Groups functionality is not implemented yet.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => {
                // TODO: Implement create group
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.createButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <SectionCard title="Group Features">
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={24} color={colors.text.tertiary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Group Management</Text>
              <Text style={styles.featureDescription}>Create and manage groups (Coming Soon)</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="settings-outline" size={24} color={colors.text.tertiary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Group Settings</Text>
              <Text style={styles.featureDescription}>Configure group preferences (Coming Soon)</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="share-outline" size={24} color={colors.text.tertiary} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Invite Members</Text>
              <Text style={styles.featureDescription}>Invite friends to groups (Coming Soon)</Text>
            </View>
          </View>
        </SectionCard>
      </View>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: colors.background.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[600],
    marginLeft: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});

export default GroupsScreen;