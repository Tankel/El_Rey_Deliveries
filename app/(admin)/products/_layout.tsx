import { Stack } from 'expo-router';

export default function AdminProductsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Productos',
          headerBackButtonDisplayMode: 'default',
        }}
      />
    </Stack>
  );
}
