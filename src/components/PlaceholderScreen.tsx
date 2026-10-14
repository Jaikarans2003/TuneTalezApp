import { Href, Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type Props = {
  title: string;
  subtitle?: string;
  links?: { href: Href; label: string }[];
};

export function PlaceholderScreen({ title, subtitle, links = [] }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {links.map((link) => (
        <Link key={String(link.href)} href={link.href} style={styles.link}>
          {link.label}
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  block: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    color: colors.text,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
