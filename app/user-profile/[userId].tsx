import { Redirect, useLocalSearchParams } from 'expo-router';

export default function UserProfileRedirect() {
  const params = useLocalSearchParams<{
    userId: string;
    username?: string;
    name?: string;
    avatarUrl?: string;
    role?: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: '/user/[username]',
        params: {
          username: params.username || '_',
          userId: params.userId,
        },
      }}
    />
  );
}
