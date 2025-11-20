import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import Account from "../../components/Account";

export default function Profile() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <View style={styles.container}>
      {session && <Account session={session} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
