import { Stack } from 'expo-router';

export default function AdminUsersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Usuarios',
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
