// src/navigation/AppNavigator.tsx
export type RootStackParamList = {
  HomeTabs: undefined;
  NewSchedule: undefined;
  EditSchedule: { id: number };
};

import 'react-native-gesture-handler';
import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions
} from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions
} from '@react-navigation/bottom-tabs';
import {
  Home as HomeIcon,
  Droplet,
  Calendar as CalendarIcon,
  ClipboardList,
  Settings as SettingsIcon
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import MotorScreen from '../screens/MotorScreen';
import LogsScreen from '../screens/LogsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NewScheduleScreen from '../screens/NewScheduleScreen';
import EditScheduleScreen from '../screens/EditScheduleScreen';

import colors from '../constants/colors';
import { useThemeStore } from '../stores/theme-store';

const Tab = createBottomTabNavigator<{
  Home: undefined;
  Motor: undefined;
  Logs: undefined;
  Schedule: undefined;
  Settings: undefined;
}>();
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const systemScheme = useColorScheme();
  const { theme } = useThemeStore();
  const activeTheme = theme || systemScheme || 'light';
  const themeColors = activeTheme === 'dark' ? colors.dark : colors.light;

  const tabOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: themeColors.tabIconDefault,
    tabBarStyle: {
      backgroundColor: themeColors.tab,
      borderTopColor: 'transparent',
      height: 64,
      paddingBottom: Platform.OS === 'ios' ? 12 : 8,
      paddingTop: 4,
      borderRadius: 24,
      marginHorizontal: 16,
      marginBottom: 16,
      position: 'absolute'
    },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Platform.OS === 'ios' ? 4 : 2 // ✅ Yazıyı yukarı çeker
  },
  tabBarIconStyle: {
    marginTop: Platform.OS === 'ios' ? -2 : 0 // ✅ İkonu yukarı çeker
  }
  };

  const stackOptions: NativeStackNavigationOptions = {
    headerStyle: { backgroundColor: themeColors.background },
    headerTintColor: themeColors.text,
    headerTitleStyle: { fontWeight: '800', fontSize: 20 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: themeColors.background }
  };

  function HomeTabs() {
    return (
      <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen name="Home" component={HomeScreen} options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <HomeIcon size={focused ? size+2: size} color={color} strokeWidth={focused?2.5:2}/>
          )
        }} />
        <Tab.Screen name="Motor" component={MotorScreen} options={{
          title: 'Control',
          tabBarIcon: ({ color, size, focused }) => (
            <Droplet size={focused ? size+2: size} color={color} strokeWidth={focused?2.5:2}/>
          )
        }} />
        <Tab.Screen name="Logs" component={LogsScreen} options={{
          title: 'Logs',
          tabBarIcon: ({ color, size, focused }) => (
            <ClipboardList size={focused ? size+2: size} color={color} strokeWidth={focused?2.5:2}/>
          )
        }} />
        <Tab.Screen name="Schedule" component={ScheduleScreen} options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size, focused }) => (
            <CalendarIcon size={focused ? size+2: size} color={color} strokeWidth={focused?2.5:2}/>
          )
        }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <SettingsIcon size={focused ? size+2: size} color={color} strokeWidth={focused?2.5:2}/>
          )
        }} />
      </Tab.Navigator>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeTabs" screenOptions={stackOptions}>
        <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
        <Stack.Screen name="NewSchedule" component={NewScheduleScreen} options={{ title: 'New Schedule', presentation: 'modal' }} />
        <Stack.Screen name="EditSchedule" component={EditScheduleScreen} options={{ title: 'Edit Schedule', presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}