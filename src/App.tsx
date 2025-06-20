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
import AnalyzeScreen from './screens/AnalyzeScreen';
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
function HomeScreen() {
  return <View style={styles.center}><Text>Home</Text></View>;
}
function StatsScreen() {
  return <View style={styles.center}><Text>Stats</Text></View>;
}
function CommunityScreen() {
  return <View style={styles.center}><Text>Community</Text></View>;
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
              if (route.name === 'Home') iconName = 'tennis';
              else if (route.name === 'Stats') iconName = 'chart-bar';
              else if (route.name === 'Record') iconName = 'video';
              else if (route.name === 'Analyze') iconName = 'account-group';
              else if (route.name === 'Profile') iconName = 'account';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarLabelStyle: { fontSize: 12 },
            tabBarActiveTintColor: '#00b894',
            tabBarInactiveTintColor: 'gray',
            headerShown: false, // <-- Add this line
          }) as BottomTabNavigationOptions}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Stats" component={StatsScreen} />
          <Tab.Screen name="Record" component={AnalyzeScreen} />
          <Tab.Screen name="Analyze" component={VideoStack} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
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
