import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title={`Series ${id ?? ''}`}
      subtitle="Episode list and player will wire up in later phases."
    />
  );
}
