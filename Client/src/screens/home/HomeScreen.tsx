import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SectionCard from '../../components/SectionCard';
import colors from '../../theme/colors';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 11 }]}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-outline" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <SectionCard title="Welcome to CoinBreakr">
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeIcon}>🏠</Text>
            <Text style={styles.welcomeTitle}>Home Dashboard</Text>
            <Text style={styles.welcomeText}>
              This is a dummy home screen. The main functionality is in the Friends tab where you can manage your friends and add new ones.
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Friends')}
          >
            <Ionicons name="people-outline" size={24} color={colors.primary[600]} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Friends</Text>
              <Text style={styles.actionSubtitle}>View and add friends</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Groups')}
          >
            <Ionicons name="grid-outline" size={24} color={colors.primary[600]} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Groups</Text>
              <Text style={styles.actionSubtitle}>Manage your groups</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={24} color={colors.primary[600]} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Profile</Text>
              <Text style={styles.actionSubtitle}>View your profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
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
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: colors.background.secondary,
  },
  welcomeContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});

export default HomeScreen;