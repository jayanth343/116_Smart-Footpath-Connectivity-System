import React from "react";
import { View, StyleSheet } from "react-native";
import SignInComponent from "../../components/SignInComponent";

export default function SignIn() {
  return (
    <View style={styles.container}>
      <SignInComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
