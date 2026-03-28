import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          title: 'User Login' 
        }} 
      />
      <Stack.Screen 
        name="staff-login" 
        options={{ 
          headerShown: false,
          title: 'Staff Login' 
        }} 
      />
    </Stack>
  );
}
