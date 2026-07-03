import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EA580C', // saffron 600
        headerShown: false, // We'll build custom headers for aesthetic reasons
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color }) => <FontAwesome5 name="om" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dincharya"
        options={{
          title: 'Dincharya',
          tabBarIcon: ({ color }) => <FontAwesome5 name="list-alt" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
