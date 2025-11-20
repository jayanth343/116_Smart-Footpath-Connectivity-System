import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function UploadScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });
  const [heading, setHeading] = useState<number>(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animated values for button press
  const galleryScale = useSharedValue(1);
  const cameraScale = useSharedValue(1);
  const uploadScale = useSharedValue(1);

  const galleryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: galleryScale.value }],
  }));

  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }));

  const uploadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: uploadScale.value }],
  }));

  // Function to calculate heading from magnetometer data
  const degreeFromVector = (x: number, y: number) => {
    let angle = Math.atan2(y, x);
    angle = angle * (180 / Math.PI); // radians to degrees
    angle = angle - 90; // adjust so 0 is North
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  };

  // Initialize magnetometer for bearing
  useEffect(() => {
    const subscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      const angle = degreeFromVector(x, y);
      setHeading(angle);
    });

    Magnetometer.setUpdateInterval(100); // in ms

    return () => {
      subscription.remove();
    };
  }, []);

  const pickImage = async () => {
    galleryScale.value = withSpring(0.9, {}, () => {
      galleryScale.value = withSpring(1);
    });

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant access to your photo library"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setRating(null);
    }
  };

  const takePhoto = async () => {
    cameraScale.value = withSpring(0.9, {}, () => {
      cameraScale.value = withSpring(1);
    });

    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please grant camera access");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setRating(null);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select or capture a photo first");
      return;
    }

    uploadScale.value = withSpring(0.95, {}, () => {
      uploadScale.value = withSpring(1);
    });

    setUploading(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Please grant location access");
        setUploading(false);
        return;
      }
      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });

      const formData = new FormData();
      formData.append("image", {
        uri: image,
        type: "image/jpeg",
        name: "footpath.jpg",
      } as any);
      formData.append("startLatitude", userLocation.coords.latitude.toString());
      formData.append(
        "startLongitude",
        userLocation.coords.longitude.toString()
      );
      formData.append("user_rating", userRating.toString());
      formData.append("bearing", heading.toString());

      // Always create new footpath - snapping system handles connectivity
      proceedWithUpload(formData);
    } catch (error) {
      console.error("Error in uploadImage:", error);
      Alert.alert("Error", "Failed to upload. Please try again.");
      setUploading(false);
    }
  };

  const proceedWithUpload = async (formData: FormData) => {
    try {
      const response = await fetch(
        "https://pf-new-api.onrender.com/upload-image",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();

      if (data.Error) {
        Alert.alert("Error", data.Error);
      } else {
        setRating(data.Percentage);

        const message = `Success! Rating: ${data.Percentage.toFixed(1)}%`;

        Alert.alert("Success", message, [
          {
            text: "OK",
            onPress: () => {
              setImage(null);
              setRating(null);
              setUserRating(0);
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error uploading:", error);
      Alert.alert("Error", "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 70) return "#4CAF50"; // Good - Green
    if (rating >= 40) return "#FFC107"; // Average - Yellow
    return "#F44336"; // Poor - Red
  };

  return (
    <LinearGradient
      colors={isDark ? ["#0f0f0f", "#1a1a1a"] : ["#f8f9fa", "#ffffff"]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
            Analyze Footpath
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? "#888" : "#666" }]}>
            Capture or select a photo to analyze
          </Text>
        </Animated.View>

        {/* Image Preview */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.imageSection}
        >
          <View
            style={[
              styles.imageContainer,
              { backgroundColor: isDark ? "#252525" : "#ffffff" },
            ]}
          >
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImage(null);
                    setRating(null);
                  }}
                >
                  <BlurView
                    intensity={80}
                    tint={isDark ? "dark" : "light"}
                    style={styles.blurButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={isDark ? "#fff" : "#000"}
                    />
                  </BlurView>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.placeholderContainer}>
                <LinearGradient
                  colors={
                    isDark ? ["#2a2a2a", "#1f1f1f"] : ["#f0f0f0", "#e0e0e0"]
                  }
                  style={styles.placeholderGradient}
                >
                  <Ionicons
                    name="image-outline"
                    size={64}
                    color={isDark ? "#555" : "#bbb"}
                  />
                  <Text
                    style={[
                      styles.placeholderText,
                      { color: isDark ? "#666" : "#999" },
                    ]}
                  >
                    No image selected
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.actionsContainer}
        >
          <Animated.View style={[styles.actionButton, galleryAnimatedStyle]}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <LinearGradient
                colors={
                  isDark ? ["#2a2a2a", "#1f1f1f"] : ["#ffffff", "#f5f5f5"]
                }
                style={styles.actionButtonGradient}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: isDark ? "#4285F4" : "#0066cc" },
                  ]}
                >
                  <Ionicons name="images" size={28} color="#fff" />
                </View>
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: isDark ? "#fff" : "#1a1a1a" },
                  ]}
                >
                  Gallery
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.actionButton, cameraAnimatedStyle]}>
            <TouchableOpacity onPress={takePhoto} activeOpacity={0.8}>
              <LinearGradient
                colors={
                  isDark ? ["#2a2a2a", "#1f1f1f"] : ["#ffffff", "#f5f5f5"]
                }
                style={styles.actionButtonGradient}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: isDark ? "#4285F4" : "#0066cc" },
                  ]}
                >
                  <Ionicons name="camera" size={28} color="#fff" />
                </View>
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: isDark ? "#fff" : "#1a1a1a" },
                  ]}
                >
                  Camera
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Rating Section */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          style={[
            styles.ratingSection,
            { backgroundColor: isDark ? "#252525" : "#ffffff" },
          ]}
        >
          <Text
            style={[styles.ratingTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
          >
            Your Rating
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setUserRating(star)}
                style={styles.starButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={userRating >= star ? "star" : "star-outline"}
                  size={36}
                  color={
                    userRating >= star ? "#FFD700" : isDark ? "#444" : "#ddd"
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Upload Button */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(600)}
          style={uploadAnimatedStyle}
        >
          <TouchableOpacity
            onPress={uploadImage}
            disabled={!image || uploading}
            activeOpacity={0.8}
            style={[styles.uploadButton, { opacity: image ? 1 : 0.5 }]}
          >
            <LinearGradient
              colors={["#4285F4", "#0066cc"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadButtonGradient}
            >
              {uploading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.uploadButtonText}>Analyze Footpath</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Results */}
        {rating !== null && (
          <Animated.View
            entering={FadeInDown.delay(1000).duration(600)}
            style={[
              styles.resultCard,
              { backgroundColor: isDark ? "#252525" : "#ffffff" },
            ]}
          >
            <View style={styles.resultHeader}>
              <Ionicons
                name="analytics"
                size={28}
                color={getRatingColor(rating)}
              />
              <Text
                style={[
                  styles.resultTitle,
                  { color: isDark ? "#fff" : "#1a1a1a" },
                ]}
              >
                Analysis Result
              </Text>
            </View>

            <View
              style={[
                styles.ratingBadge,
                { backgroundColor: getRatingColor(rating) },
              ]}
            >
              <Text style={styles.ratingValue}>{rating.toFixed(1)}%</Text>
            </View>

            <Text
              style={[
                styles.ratingDescription,
                { color: isDark ? "#bbb" : "#666" },
              ]}
            >
              {rating >= 70
                ? "✨ Excellent quality footpath"
                : rating >= 40
                ? "👌 Average quality footpath"
                : "⚠️ Poor quality footpath"}
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    width: "100%",
    height: width - 40,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  blurButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  placeholderContainer: {
    flex: 1,
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  ratingSection: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  uploadButton: {
    marginBottom: 24,
  },
  uploadButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  resultCard: {
    padding: 28,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  ratingBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  ratingDescription: {
    fontSize: 17,
    textAlign: "center",
    fontWeight: "600",
  },
});
