import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Redirect, Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

const IndexPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );
    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);
  if (isLoading) {
    return null;
  }
  if (session && session.user) {
    return <Redirect href={"/(tabs)"} />;
  }
  return <Redirect href={"/(auth)/signin"} />;
};

export default IndexPage;
