import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      title="Profile"
      subtitle="Account placeholder."
      links={[
        { href: '/sign-in', label: 'Sign in' },
        { href: '/settings', label: 'Settings' },
      ]}
    />
  );
}
