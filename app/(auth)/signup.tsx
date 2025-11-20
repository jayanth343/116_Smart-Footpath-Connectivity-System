import React from "react";
import { View, StyleSheet } from "react-native";
import SignUpComponent from "../../components/SignUpComponent";

export default function SignUp() {
  return (
    <View style={styles.container}>
      <SignUpComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
