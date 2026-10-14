import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function MyListScreen() {
  return (
    <PlaceholderScreen
      title="My List"
      subtitle="Saved series will appear here after sign-in."
      links={[{ href: '/sign-in', label: 'Sign in' }]}
    />
  );
}
