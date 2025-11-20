import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import { Magnetometer } from "expo-sensors";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import MapView, {
  Circle,
  MapStyleElement,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";

const degreeFromVector = (x: number, y: number) => {
  let angle = Math.atan2(y, x);
  angle = angle * (180 / Math.PI); // radians to degrees
  angle = angle - 90; // adjust so 0 is North
  if (angle < 0) {
    angle += 360;
  }
  return angle;
};


// Dark mode map style for iOS
const darkMapStyle: MapStyleElement[] = [
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

export default function MapScreen() {
  const [data, setData] = useState<any[]>([]);
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [footpaths, setFootpaths] = useState<any[]>([]);
  const [selectedFootpath, setSelectedFootpath] = useState<any | null>(null);
  const [selectedFootpathId, setSelectedFootpathId] = useState<string | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const refreshIntervalRef = useRef<number | null>(null);
  const selectionTimeoutRef = useRef<number | null>(null);
  const isFocusedRef = useRef(false);
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">(
    "standard"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [relatedFootpaths, setRelatedFootpaths] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("location-footpath")
        .select("*");
      setData(data || []);
      console.log("Map data refreshed with", data?.length || 0, "footpaths");
    } catch (error) {
      console.log(error);
      setData([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up automatic refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log("Map screen focused - starting auto refresh");
      isFocusedRef.current = true;

      // Immediate refresh when screen comes into focus
      fetchData();

      // Set up interval refresh every 10 seconds while screen is focused
      refreshIntervalRef.current = setInterval(() => {
        if (isFocusedRef.current) {
          console.log("Auto-refreshing map data...");
          fetchData();
        }
      }, 10000); // Refresh every 10 seconds

      // Cleanup function when screen loses focus
      return () => {
        console.log("Map screen unfocused - stopping auto refresh");
        isFocusedRef.current = false;
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        // Clear selection timeout when leaving screen
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
          selectionTimeoutRef.current = null;
        }
      };
    }, [fetchData])
  );

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: any) => {
      if (nextAppState === "active" && isFocusedRef.current) {
        console.log("App became active - refreshing map data");
        fetchData();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
      // Cleanup selection timeout on unmount
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [fetchData]);
  // Function to determine color based on score and selection
  const getFootpathColor = (footpath: any) => {
    // If this footpath is selected, return blue
    if (selectedFootpathId === footpath.id.toString()) {
      return "#007AFF"; // iOS blue color
    }

    // Otherwise return color based on score
    const score = footpath.rating || footpath.score || 0;
    if (score >= 70) return "#4CAF50"; // Good rating - green
    if (score >= 40) return "#FFC107"; // Average rating - yellow
    return "#F44336"; // Poor rating - red
  };

  // Original function kept for backward compatibility
  const getColorFromScore = (score: number) => {
    if (score >= 70) return "#4CAF50"; // Good rating - green
    if (score >= 40) return "#FFC107"; // Average rating - yellow
    return "#F44336"; // Poor rating - red
  };

  // Process footpaths from backend data
  useEffect(() => {
    if (data && data.length > 0) {
      const processedFootpaths = data.map((item: any) => {
        // Create coordinates array from start and end points
        const coordinates = [
          { latitude: item.latitude, longitude: item.longitude },
          { latitude: item.latitude_end, longitude: item.longitude_end },
        ];

        return {
          id: item.id,
          fid: item.fid,
          coordinates: coordinates,
          rating: item.score,
          color: getColorFromScore(item.score), // Keep original color for reference
          created_at: item.created_at,
          user_rating: item.user_rating,
          image: item.image_link,
        };
      });

      setFootpaths(processedFootpaths);
    }
  }, [data]);

  // State declarations moved to the top

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      // Start watching position
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, // update every 5 meters
          timeInterval: 1000, // update every second
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );

      // Start watching heading
      const subscription = Magnetometer.addListener((data) => {
        const { x, y } = data;
        const angle = degreeFromVector(x, y);
        setHeading(angle);
      });

      Magnetometer.setUpdateInterval(100); // in ms

      return () => {
        subscription.remove();
        locationSubscription.remove();
      };
    })();
  }, []);

  // Prepare location data for maps - memoized to prevent flickering
  const userLocation = useMemo(() => {
    return location?.coords
      ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      : undefined;
  }, [location?.coords.latitude, location?.coords.longitude]);

  // Memoize user location marker data to prevent unnecessary re-renders
  const userLocationMarker = useMemo(() => {
    if (!userLocation || !location) return null;

    return {
      location: userLocation,
      accuracy: location.coords.accuracy || 20,
    };
  }, [
    userLocation,
    location?.coords.accuracy,
  ]);

  // Animate camera to user location only on initial load
  const hasAnimatedToUser = useRef(false);
  useEffect(() => {
    if (mapRef.current && userLocation && !hasAnimatedToUser.current) {
      mapRef.current.animateCamera(
        {
          center: userLocation,
          heading: heading,
          pitch: 45,
          zoom: 17,
        },
        { duration: 1500 }
      );
      hasAnimatedToUser.current = true;
    }
  }, [userLocation]);

  // Center map on user location
  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateCamera(
        {
          center: userLocation,
          heading: heading,
          pitch: 45,
          zoom: 17,
        },
        { duration: 500 }
      );
    }
  };

  // Function to handle footpath selection
  const handleFootpathPress = async (footpath: any) => {
    console.log("Footpath pressed:", footpath);

    const footpathId = footpath.id?.toString() || footpath.id;

    // Clear any existing timeout when selecting a footpath
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }

    // If clicking the same footpath, deselect it immediately
    if (selectedFootpathId === footpathId) {
      clearSelection();
    } else {
      // Select new footpath
      setSelectedFootpathId(footpathId);
      const selectedFootpathData = footpaths.find(
        (i) => i.id.toString() === footpathId
      );
      setSelectedFootpath(selectedFootpathData);
      setUserRating(selectedFootpathData?.user_rating || null);

      // Fetch all footpaths with the same fid
      if (selectedFootpathData?.fid) {
        try {
          const { data: relatedData, error } = await supabase
            .from("location-footpath")
            .select("*")
            .eq("fid", selectedFootpathData.fid)
            .order("created_at", { ascending: false });

          if (!error && relatedData) {
            setRelatedFootpaths(relatedData);
            console.log(
              `Found ${relatedData.length} related footpaths with fid: ${selectedFootpathData.fid}`
            );
          } else {
            setRelatedFootpaths([selectedFootpathData]);
            console.log([selectedFootpathData]);
          }
        } catch (error) {
          console.error("Error fetching related footpaths:", error);
          setRelatedFootpaths([selectedFootpathData]);
        }
      } else {
        setRelatedFootpaths([selectedFootpathData]);
        console.log([selectedFootpathData]);
      }

      setCurrentImageIndex(0);
      setModalVisible(true);
    }
  };

  // Function to close the footpath info panel
  const closeFootpathInfo = () => {
    setSelectedFootpath(null);
    setModalVisible(false);
    setRelatedFootpaths([]);
    setCurrentImageIndex(0);

    // Clear any existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Keep the footpath blue for 3 seconds after closing modal
    selectionTimeoutRef.current = setTimeout(() => {
      console.log("Clearing footpath selection after delay");
      setSelectedFootpathId(null);
    }, 3000); // 3 second delay
  };

  // Function to clear selection immediately (for when selecting different footpath)
  const clearSelection = () => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = null;
    }
    setSelectedFootpathId(null);
    setSelectedFootpath(null);
    setModalVisible(false);
    setRelatedFootpaths([]);
    setCurrentImageIndex(0);
  };

  // Function to handle user rating
  const handleRating = async (rating: number) => {
    if (!selectedFootpath) return;

    setUserRating(rating);

    try {
      // Update the rating in Supabase
      const { error } = await supabase
        .from("location-footpath")
        .update({ user_rating: rating })
        .eq("id", selectedFootpath.id);

      if (error) {
        console.error("Error updating rating:", error);
        Alert.alert("Error", "Failed to update rating. Please try again.");
      } else {
        Alert.alert("Success", "Your rating has been submitted.");
      }
    } catch (error) {
      console.error("Error updating rating:", error);
      Alert.alert("Error", "Failed to update rating. Please try again.");
    }
  };

  // Function to report an issue with a footpath
  const reportIssue = () => {
    if (!selectedFootpath) return;

    Alert.alert(
      "Report Issue",
      "What issue would you like to report with this footpath?",
      [
        {
          text: "Damaged Surface",
          onPress: () => {
            Alert.alert("Thank you", "Your report has been submitted.");
            closeFootpathInfo();
          },
        },
        {
          text: "Obstruction",
          onPress: () => {
            Alert.alert("Thank you", "Your report has been submitted.");
            closeFootpathInfo();
          },
        },
        {
          text: "Accessibility Issue",
          onPress: () => {
            Alert.alert("Thank you", "Your report has been submitted.");
            closeFootpathInfo();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  
  const searchPlaces = async (text: string) => {
    setSearchQuery(text);

    if (text.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key= Enter_here`
      );
      const data = await response.json();

      if (data.predictions) {
        setSearchResults(data.predictions);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Get place details and navigate to it
  const selectPlace = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=Enter_Here`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;
        const newLocation = {
          latitude: lat,
          longitude: lng,
        };

        // Animate camera to the searched location
        if (mapRef.current) {
          mapRef.current.animateCamera(
            {
              center: newLocation,
              heading: 0,
              pitch: 45,
              zoom: 17,
            },
            { duration: 1000 }
          );
        }

        // Clear search
        setSearchQuery("");
        setSearchResults([]);
        setShowResults(false);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error("Place details error:", error);
    }
  };

  let locationText = "Waiting for location...";
  if (errorMsg) {
    locationText = errorMsg;
  } else if (location) {
    locationText = `Lat: ${location.coords.latitude.toFixed(
      4
    )}, Lng: ${location.coords.longitude.toFixed(4)}`;
  }

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
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        mapType={mapType}
        initialRegion={
          userLocation
            ? {
                ...userLocation,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
            : {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={true}
        followsUserLocation={false}
        customMapStyle={
          colorScheme === "dark" && mapType === "standard" ? darkMapStyle : []
        }
      >
        {/* Custom User Location Marker with Direction */}
        {userLocationMarker && (
          <>
            {/* Accuracy circle - separate from marker so it doesn't flicker with heading changes */}
            <Circle
              center={userLocationMarker.location}
              radius={userLocationMarker.accuracy}
              fillColor="rgba(66, 133, 244, 0.1)"
              strokeColor="rgba(66, 133, 244, 0.3)"
              strokeWidth={1}
              zIndex={0}
            />

            {/* User marker with direction indicator */}
            <Marker
              coordinate={userLocationMarker.location}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={heading}
              flat={true}
              tracksViewChanges={false}
            >
              <View style={styles.userMarker}>
                {/* Outer pulse ring */}
                <View style={styles.userMarkerPulse} />

                {/* Main marker circle */}
                <View style={styles.userMarkerCircle}>
                  <View style={styles.userMarkerInner} />
                </View>

                {/* Direction indicator (cone/arrow) */}
                <View style={styles.directionIndicator}>
                  <View style={styles.directionCone} />
                </View>
              </View>
            </Marker>
          </>
        )}

        {/* Render footpath polylines */}
        {footpaths.map((footpath) => {
          const isSelected = selectedFootpathId === footpath.id.toString();
          return (
            <Polyline
              key={footpath.id.toString()}
              coordinates={footpath.coordinates}
              strokeColor={getFootpathColor(footpath)}
              strokeWidth={isSelected ? 12 : 8}
              onPress={() => handleFootpathPress(footpath)}
              tappable={true}
              zIndex={isSelected ? 2 : 1}
            />
          );
        })}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(51, 51, 51, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colorScheme === "dark" ? "#888" : "#666"}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: colorScheme === "dark" ? "#fff" : "#000" },
            ]}
            placeholder="Search for a street or location..."
            placeholderTextColor={colorScheme === "dark" ? "#888" : "#999"}
            value={searchQuery}
            onChangeText={searchPlaces}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowResults(false);
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

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <View
            style={[
              styles.searchResultsContainer,
              {
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(51, 51, 51, 0.98)"
                    : "rgba(255, 255, 255, 0.98)",
              },
            ]}
          >
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => selectPlace(item.place_id)}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#4285F4"
                    style={styles.resultIcon}
                  />
                  <Text
                    style={[
                      styles.searchResultText,
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

      {/* Map controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colorScheme === "dark" ? "#333" : "#fff" },
          ]}
          onPress={centerOnUser}
        >
          <Ionicons name="locate" size={24} color="#4285F4" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colorScheme === "dark" ? "#333" : "#fff" },
          ]}
          onPress={() => {
            fetchData();
            Alert.alert(
              "Manual Refresh",
              "Map data refreshed!\n\nNote: Map auto-refreshes every 10 seconds while active."
            );
          }}
        >
          <Ionicons name="refresh" size={24} color="#4285F4" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colorScheme === "dark" ? "#333" : "#fff" },
          ]}
          onPress={() => {
            // Toggle between standard, satellite, and hybrid views
            setMapType((prev) => {
              if (prev === "standard") return "satellite";
              if (prev === "satellite") return "hybrid";
              return "standard";
            });
          }}
        >
          <Ionicons name="layers" size={24} color="#4285F4" />
        </TouchableOpacity>
      </View>

      {/* Footpath Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeFootpathInfo}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              { backgroundColor: colorScheme === "dark" ? "#333" : "#fff" },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: colorScheme === "dark" ? "#fff" : "#000" },
                  ]}
                >
                  Footpath Details
                </Text>
                <View
                  style={[
                    styles.selectedIndicator,
                    { backgroundColor: "#007AFF" },
                  ]}
                >
                  <Text style={styles.selectedText}>SELECTED</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeFootpathInfo}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colorScheme === "dark" ? "#fff" : "#000"}
                />
              </TouchableOpacity>
            </View>

            {selectedFootpath && (
              <>
                {/* Image Carousel */}
                <View style={styles.carouselContainer}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(event) => {
                      const offsetX = event.nativeEvent.contentOffset.x;
                      const width = Dimensions.get("window").width - 48;
                      const index = Math.round(offsetX / width);
                      setCurrentImageIndex(index);
                    }}
                    scrollEventThrottle={16}
                    style={styles.imageCarousel}
                  >
                    {relatedFootpaths.map((footpath, index) => (
                      <View
                        key={`${footpath.id}-${index}`}
                        style={styles.imageSlide}
                      >
                        {footpath.image_link ? (
                          <Image
                            source={{ uri: footpath.image_link }}
                            style={styles.footpathImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.noImageContainer,
                              {
                                backgroundColor:
                                  colorScheme === "dark"
                                    ? "#1a1a1a"
                                    : "#2a2a2a",
                              },
                            ]}
                          >
                            <View style={styles.noImageIconWrapper}>
                              <Ionicons
                                name="map-outline"
                                size={72}
                                color={
                                  colorScheme === "dark" ? "#4285F4" : "#5a9dff"
                                }
                              />
                            </View>
                            <Text
                              style={[
                                styles.noImageText,
                                {
                                  color:
                                    colorScheme === "dark" ? "#888" : "#aaa",
                                },
                              ]}
                            >
                              No Photo Available
                            </Text>
                            <Text
                              style={[
                                styles.noImageSubtext,
                                {
                                  color:
                                    colorScheme === "dark" ? "#666" : "#888",
                                },
                              ]}
                            >
                              Upload a photo to see it here
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  {/* Carousel Indicators */}
                  {relatedFootpaths.length > 1 && (
                    <View style={styles.carouselIndicators}>
                      {relatedFootpaths.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.indicator,
                            {
                              backgroundColor:
                                currentImageIndex === index
                                  ? "#4285F4"
                                  : colorScheme === "dark"
                                  ? "#666"
                                  : "#ccc",
                              width: currentImageIndex === index ? 24 : 8,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )}

                  {/* Image Counter */}
                  {relatedFootpaths.length > 1 && (
                    <View style={styles.imageCounter}>
                      <Text style={styles.imageCounterText}>
                        {currentImageIndex + 1} / {relatedFootpaths.length}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Rating Information */}
                <View style={styles.ratingContainer}>
                  <View
                    style={[
                      styles.ratingBadge,
                      { backgroundColor: selectedFootpath.color },
                    ]}
                  >
                    <Text style={styles.ratingBadgeText}>{userRating}</Text>
                  </View>

                  <Text
                    style={[
                      styles.ratingDescription,
                      { color: colorScheme === "dark" ? "#fff" : "#000" },
                    ]}
                  >
                    {selectedFootpath.user_rating >= 4
                      ? "Good quality footpath"
                      : selectedFootpath.user_rating >= 3
                      ? "Average quality footpath"
                      : "Poor quality footpath"}
                  </Text>
                </View>

                {/* User Rating */}
                <View style={styles.userRatingContainer}>
                  <Text
                    style={[
                      styles.userRatingTitle,
                      { color: colorScheme === "dark" ? "#fff" : "#000" },
                    ]}
                  >
                    Rate this footpath:
                  </Text>

                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleRating(star)}
                        style={styles.starButton}
                      >
                        <Ionicons
                          name={
                            userRating && star <= userRating
                              ? "star"
                              : "star-outline"
                          }
                          size={32}
                          color={
                            userRating && star <= userRating
                              ? "#FFC107"
                              : "#aaa"
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.reportIssueButton}
                  onPress={reportIssue}
                >
                  <Ionicons name="warning" size={20} color="#fff" />
                  <Text style={styles.reportIssueButtonText}>Report Issue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 80,
    zIndex: 100,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  searchResultsContainer: {
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  resultIcon: {
    marginRight: 10,
  },
  searchResultText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  resultSeparator: {
    height: 0.5,
    marginHorizontal: 12,
  },
  mapControls: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  userMarker: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  userMarkerPulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(66, 133, 244, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(66, 133, 244, 0.4)",
  },
  userMarkerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  directionIndicator: {
    position: "absolute",
    top: -8,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
  },
  directionCone: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(66, 133, 244, 0.8)",
    transform: [{ translateX: -8 }],
  },
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    width: "100%",
    maxHeight: "85%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  selectedIndicator: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  selectedText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  carouselContainer: {
    width: "100%",
    marginBottom: 20,
  },
  imageCarousel: {
    width: "100%",
  },
  imageSlide: {
    width: Dimensions.get("window").width - 48,
    height: 240,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  carouselIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  imageCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  footpathImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(66, 133, 244, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noImageText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  noImageSubtext: {
    fontSize: 14,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  ratingBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ratingBadgeText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  ratingDescription: {
    fontSize: 18,
    flex: 1,
    fontWeight: "600",
  },
  userRatingContainer: {
    marginBottom: 24,
  },
  userRatingTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  starButton: {
    padding: 6,
  },
  reportIssueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5252",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  reportIssueButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});