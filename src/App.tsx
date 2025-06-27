/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import VideoScreen from './screens/VideoScreen';
import VideoPlayer from './screens/VideoPlayer';  
import ProfileScreen from './screens/ProfileScreen';
import PoseScreen from './screens/PoseScreen';
import { VideoProvider } from './context/VideoContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Splash Screen
function SplashScreen() {
  React.useEffect(() => {
    setTimeout(() => {
      // ...existing code...
    }, 1500);
  }, []);
  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashText}>TennisMotion</Text>
      <ActivityIndicator size="large" color="#00b894" />
    </View>
  );
}

// Placeholder views for tabs
function StatsScreen() {
  return <View style={styles.center}><Text>Stats</Text></View>;
}
function SessionsScreen() {
  return <View style={styles.center}><Text>Sessions</Text></View>;
}
function MoreScreen() {
  return <View style={styles.center}><Text>More</Text></View>;
}

const VideoStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VideoScreen" component={VideoScreen} />
    <Stack.Screen name="VideoPlayer" component={VideoPlayer} />
  </Stack.Navigator>
);

export default function App() {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setTimeout(() => setLoading(false), 1500);
  }, []);
  if (loading) return <SplashScreen />;
  return (
    <VideoProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({
            route,
          }: { route: RouteProp<ParamListBase, string> }) => ({
            tabBarIcon: ({ color, size }: { color: string; size: number }) => {
              let iconName = '';
              if (route.name === 'Stats') iconName = 'chart-bar';
              else if (route.name === 'Sessions') iconName = 'tennis-ball';
              else if (route.name === 'Coaching') iconName = 'account-multiple';
              else if (route.name === 'Profile') iconName = 'account';
              else if (route.name === 'More') iconName = 'dots-horizontal';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarLabelStyle: { fontSize: 12 },
            tabBarActiveTintColor: '#00b894',
            tabBarInactiveTintColor: 'gray',
            headerShown: false, // <-- Add this line to hide the header
          }) as BottomTabNavigationOptions}
        >
          <Tab.Screen name="Stats" component={StatsScreen} />
          <Tab.Screen name="Sessions" component={PoseScreen} />
          <Tab.Screen name="Coaching" component={VideoStack} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="More" component={MoreScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </VideoProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00b894',
    marginBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
