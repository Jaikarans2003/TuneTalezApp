import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      subtitle="Series rails will load from Supabase in a later step."
      links={[{ href: '/series/1', label: 'Open sample series' }]}
    />
  );
}
