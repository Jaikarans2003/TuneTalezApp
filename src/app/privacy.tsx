import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.body}>
        This is a placeholder privacy policy for TuneTalez. It will be replaced with the full
        policy before launch. Contact: support@tunetalez.com
      </Text>
      <Text style={styles.body}>
        We collect account information you provide (for example email when you sign up with email
        and password, or profile details from Google when you use Sign in with Google) to operate
        the service. This page exists so Google OAuth branding can link to
        https://tunetalez.com/privacy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
