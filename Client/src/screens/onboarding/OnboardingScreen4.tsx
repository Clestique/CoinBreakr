import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

interface OnboardingScreen4Props {
  navigation: any;
}

const OnboardingScreen4: React.FC<OnboardingScreen4Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚀</Text>
        </View>
        
        <Text style={styles.title}>Ready to Get Started?</Text>
        <Text style={styles.subtitle}>
          Join thousands of users who are already splitting expenses effortlessly
        </Text>
        
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✅</Text>
            <Text style={styles.benefitText}>Free to use forever</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✅</Text>
            <Text style={styles.benefitText}>Secure and private</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✅</Text>
            <Text style={styles.benefitText}>Works offline</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  benefitsContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#059669',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  getStartedButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 12,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen4;