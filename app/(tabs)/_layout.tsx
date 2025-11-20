import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);
  const fabTranslateY = useSharedValue(0);

  const isDark = colorScheme === "dark";
  const isUploadActive = pathname === "/upload";

  useEffect(() => {
    if (isUploadActive) {
      fabRotation.value = withSpring(45, { damping: 12 });
      fabTranslateY.value = withSpring(0, { damping: 12 });
    } else {
      fabRotation.value = withSpring(0, { damping: 12 });
      fabTranslateY.value = withSpring(20, { damping: 12 });
    }
  }, [isUploadActive]);

  const animatedFabStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: fabScale.value },
        { rotate: `${fabRotation.value}deg` },
        { translateY: fabTranslateY.value },
      ],
    };
  });

  const handleFabPress = () => {
    fabScale.value = withSpring(0.85, { damping: 10 }, () => {
      fabScale.value = withSpring(1, { damping: 10 });
    });
    router.push("/upload");
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDark ? "#4285F4" : "#0066cc",
          tabBarInactiveTintColor: isDark ? "#666" : "#999",
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            borderTopWidth: 0,
            height: Platform.OS === "ios" ? 88 : 70,
            paddingBottom: Platform.OS === "ios" ? 28 : 12,
            paddingTop: 12,
            elevation: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Map",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused && styles.activeIconContainer}>
                <Ionicons
                  name={focused ? "map" : "map-outline"}
                  size={focused ? 26 : 24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="navigate"
          options={{
            title: "Navigate",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused && styles.activeIconContainer}>
                <Ionicons
                  name={focused ? "navigate" : "navigate-outline"}
                  size={focused ? 26 : 24}
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: "",
            headerShown: false,
            tabBarIcon: () => null,
            tabBarButton: () => (
              <View style={styles.fabContainer}>
                <TouchableOpacity onPress={handleFabPress} activeOpacity={0.8}>
                  <Animated.View
                    style={[
                      styles.fab,
                      animatedFabStyle,
                      {
                        backgroundColor: isDark ? "#4285F4" : "#0066cc",
                        shadowColor: isDark ? "#4285F4" : "#0066cc",
                      },
                    ]}
                  >
                    <Ionicons name="add" size={32} color="#ffffff" />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused && styles.activeIconContainer}>
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={focused ? 26 : 24}
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  fabContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    top: -20,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
