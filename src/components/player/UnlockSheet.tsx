import { Modal, Pressable, StyleSheet, Text } from 'react-native'

import { UNLOCK_COST_COINS } from '@/constants/coins'
import { colors } from '@/constants/colors'

type Props = {
  visible: boolean
  episodeTitle?: string
  onClose: () => void
}

/** Phase 2 shell — no wallet or payment SDK until Phase 3. */
export function UnlockSheet({ visible, episodeTitle, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Unlock episode</Text>
          {episodeTitle ? <Text style={styles.subtitle}>{episodeTitle}</Text> : null}
          <Text style={styles.cost}>{UNLOCK_COST_COINS} coins</Text>
          <Text style={styles.balance}>Your balance: — (Phase 3)</Text>
          <Pressable style={styles.primary} onPress={onClose}>
            <Text style={styles.primaryText}>Coming in Phase 3</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onClose}>
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
  },
  cost: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  balance: {
    color: colors.textMuted,
    fontSize: 14,
  },
  primary: {
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 15,
  },
})
