import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import MapView, {
    Marker,
    Polyline,
    PROVIDER_DEFAULT,
    PROVIDER_GOOGLE
} from "react-native-maps";


const FLASK_SERVER_URL = "http://192.168.1.2:5000"; // For Android emulator, use your actual server URL for device

// Dark mode map style
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

interface PlaceResult {
  place_id: string;
  description: string;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function NavigateScreen() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [sourceQuery, setSourceQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [sourceCoords, setSourceCoords] = useState<RouteCoordinate | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<RouteCoordinate | null>(null);
  const [routePath, setRoutePath] = useState<RouteCoordinate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceResults, setSourceResults] = useState<PlaceResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<PlaceResult[]>([]);
  const [showSourceResults, setShowSourceResults] = useState(false);
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [activeInput, setActiveInput] = useState<"source" | "destination" | null>(null);
  
  const colorScheme = useColorScheme();
  const mapRef = useRef<MapView>(null);

  // Get user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required for navigation.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      
      // Set default source as current location
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setSourceCoords(coords);
      setSourceQuery("Current Location");

      // Center map on user's current location
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.animateCamera(
            {
              center: coords,
              zoom: 15,
            },
            { duration: 1000 }
          );
        }, 500);
      }
    })();
  }, []);

  // Center map when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (location && mapRef.current) {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        mapRef.current.animateCamera(
          {
            center: coords,
            zoom: 15,
          },
          { duration: 800 }
        );
      }
    }, [location])
  );

  // Helper function to parse coordinate input
  const parseCoordinates = (text: string): { latitude: number; longitude: number } | null => {
    // Remove any whitespace
    const cleaned = text.trim();
    
    // Try to match various coordinate formats:
    // "12.9716, 77.5946" or "12.9716,77.5946" or "12.9716 77.5946"
    const coordRegex = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const match = cleaned.match(coordRegex);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { latitude: lat, longitude: lng };
      }
    }
    
    return null;
  };

 
  const searchPlaces = async (text: string, isSource: boolean) => {
    if (isSource) {
      setSourceQuery(text);
    } else {
      setDestinationQuery(text);
    }

    if (text.length < 2) {
      if (isSource) {
        setSourceResults([]);
        setShowSourceResults(false);
      } else {
        setDestinationResults([]);
        setShowDestinationResults(false);
      }
      return;
    }

    // Check if input is coordinates
    const coords = parseCoordinates(text);
    if (coords) {
      // Directly set the coordinates without showing results
      if (isSource) {
        setSourceCoords(coords);
        setSourceResults([]);
        setShowSourceResults(false);
      } else {
        setDestinationCoords(coords);
        setDestinationResults([]);
        setShowDestinationResults(false);
      }
      Keyboard.dismiss();
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${}&types=`
      );
      const data = await response.json();

      if (data.predictions) {
        if (isSource) {
          setSourceResults(data.predictions);
          setShowSourceResults(true);
        } else {
          setDestinationResults(data.predictions);
          setShowDestinationResults(true);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Get place details and coordinates
  const selectPlace = async (placeId: string, isSource: boolean) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&fields=geometry,name`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const coords = { latitude: lat, longitude: lng };
        const name = data.result.name || "";

        if (isSource) {
          setSourceCoords(coords);
          setSourceQuery(name);
          setSourceResults([]);
          setShowSourceResults(false);
        } else {
          setDestinationCoords(coords);
          setDestinationQuery(name);
          setDestinationResults([]);
          setShowDestinationResults(false);
        }

        Keyboard.dismiss();
      }
    } catch (error) {
      console.error("Place details error:", error);
      Alert.alert("Error", "Failed to get place details");
    }
  };

  // Reset to current location as source
  const resetToCurrentLocation = () => {
    if (location) {
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSourceCoords(coords);
      setSourceQuery("Current Location");
      setSourceResults([]);
      setShowSourceResults(false);
    }
  };

  // Calculate route using Flask server
  const calculateRoute = async () => {
    if (!sourceCoords || !destinationCoords) {
      Alert.alert("Error", "Please select both source and destination");
      return;
    }

    setLoading(true);
    setRoutePath([]);

    try {
      const response = await fetch(`${FLASK_SERVER_URL}/navigate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: [sourceCoords.latitude, sourceCoords.longitude],
          goal: [destinationCoords.latitude, destinationCoords.longitude],
        }),
      });

      const data = await response.json();

      if (data.path && Array.isArray(data.path)) {
        // Convert path array to coordinate objects
        const pathCoordinates = data.path.map((point: [number, number]) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        setRoutePath(pathCoordinates);

        // Fit map to show entire route
        if (mapRef.current && pathCoordinates.length > 0) {
          mapRef.current.fitToCoordinates(pathCoordinates, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }

        Alert.alert(
          "Route Found",
          `Route calculated using ${data.source === "custom" ? "custom footpaths" : "Google Directions"}`
        );
      } else if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        Alert.alert("Error", "No route found");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Error", "Failed to calculate route. Make sure the Flask server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Clear route
  const clearRoute = () => {
    setRoutePath([]);
    setDestinationQuery("");
    setDestinationCoords(null);
    setDestinationResults([]);
    setShowDestinationResults(false);
  };

  const userLocation = location?.coords
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
    : undefined;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#121212" : "#f5f5f5" },
      ]}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={
          userLocation
            ? {
                ...userLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
        }
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        customMapStyle={colorScheme === "dark" ? darkMapStyle : []}
      >
        {/* Source marker */}
        {sourceCoords && (
          <Marker
            coordinate={sourceCoords}
            title="Source"
            pinColor="green"
          />
        )}

        {/* Destination marker */}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            pinColor="red"
          />
        )}

        {/* Route polyline */}
        {routePath.length > 0 && (
          <Polyline
            coordinates={routePath}
            strokeColor="#007AFF"
            strokeWidth={5}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(30, 30, 30, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
          },
        ]}
      >
        <Text
          style={[
            styles.headerText,
            { color: colorScheme === "dark" ? "#fff" : "#000" },
          ]}
        >
          Plan Your Route
        </Text>

        {/* Source Input */}
        <View style={styles.inputWrapper}>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor:
                  colorScheme === "dark" ? "rgba(51, 51, 51, 0.8)" : "#f8f8f8",
              },
            ]}
          >
            <Ionicons
              name="location"
              size={20}
              color="#4CAF50"
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
              placeholder="Source (Current Location)"
              placeholderTextColor={colorScheme === "dark" ? "#888" : "#999"}
              value={sourceQuery}
              onChangeText={(text) => searchPlaces(text, true)}
              onFocus={() => {
                setActiveInput("source");
                if (sourceQuery.length >= 2) setShowSourceResults(true);
              }}
            />
            {sourceQuery !== "Current Location" && (
              <TouchableOpacity onPress={resetToCurrentLocation}>
                <Ionicons
                  name="locate"
                  size={20}
                  color={colorScheme === "dark" ? "#888" : "#666"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Source Results */}
          {showSourceResults && sourceResults.length > 0 && (
            <View
              style={[
                styles.resultsContainer,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(51, 51, 51, 0.98)"
                      : "rgba(255, 255, 255, 0.98)",
                },
              ]}
            >
              <FlatList
                data={sourceResults}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => selectPlace(item.place_id, true)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#4285F4"
                      style={styles.resultIcon}
                    />
                    <Text
                      style={[
                        styles.resultText,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View
                    style={[
                      styles.resultSeparator,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#444" : "#e0e0e0",
                      },
                    ]}
                  />
                )}
              />
            </View>
          )}
        </View>

        {/* Destination Input */}
        <View style={styles.inputWrapper}>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor:
                  colorScheme === "dark" ? "rgba(51, 51, 51, 0.8)" : "#f8f8f8",
              },
            ]}
          >
            <Ionicons
              name="flag"
              size={20}
              color="#F44336"
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
              placeholder="Destination"
              placeholderTextColor={colorScheme === "dark" ? "#888" : "#999"}
              value={destinationQuery}
              onChangeText={(text) => searchPlaces(text, false)}
              onFocus={() => {
                setActiveInput("destination");
                if (destinationQuery.length >= 2) setShowDestinationResults(true);
              }}
            />
            {destinationQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setDestinationQuery("");
                  setDestinationCoords(null);
                  setDestinationResults([]);
                  setShowDestinationResults(false);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colorScheme === "dark" ? "#888" : "#666"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Destination Results */}
          {showDestinationResults && destinationResults.length > 0 && (
            <View
              style={[
                styles.resultsContainer,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(51, 51, 51, 0.98)"
                      : "rgba(255, 255, 255, 0.98)",
                },
              ]}
            >
              <FlatList
                data={destinationResults}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => selectPlace(item.place_id, false)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#4285F4"
                      style={styles.resultIcon}
                    />
                    <Text
                      style={[
                        styles.resultText,
                        { color: colorScheme === "dark" ? "#fff" : "#000" },
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View
                    style={[
                      styles.resultSeparator,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#444" : "#e0e0e0",
                      },
                    ]}
                  />
                )}
              />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.calculateButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={calculateRoute}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.buttonText}>Find Route</Text>
              </>
            )}
          </TouchableOpacity>

          {routePath.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearRoute}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {routePath.length > 0 && (
          <View style={styles.routeInfo}>
            <Ionicons name="information-circle" size={20} color="#4285F4" />
            <Text
              style={[
                styles.routeInfoText,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
            >
              Route displayed in blue on the map
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  inputContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  resultsContainer: {
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultIcon: {
    marginRight: 8,
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
  },
  resultSeparator: {
    height: 0.5,
    marginHorizontal: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  calculateButton: {
    backgroundColor: "#4285F4",
  },
  clearButton: {
    backgroundColor: "#F44336",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  routeInfoText: {
    fontSize: 13,
    flex: 1,
  },
});
