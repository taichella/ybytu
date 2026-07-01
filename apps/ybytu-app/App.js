import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { NativeWindStyleSheet } from "nativewind";
import { supabase } from './src/lib/supabase';

NativeWindStyleSheet.setOutput({
  default: "native",
});

import LoginScreen from './src/components/LoginScreen';
import RegisterScreen from './src/components/RegisterScreen';
import { Onboarding } from './src/components/Onboarding';
import HomeScreen from './src/components/HomeScreen';
import ProfileScreen from './src/components/ProfileScreen';
import NutritionScreen from './src/components/NutritionScreen';
import TrainingScreen from './src/components/TrainingScreen';
import StartTrainingScreen from './src/components/StartTrainingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkProfileStatus(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkProfileStatus(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileStatus = async (currentSession) => {
    if (!currentSession?.user) {
      setHasCompletedOnboarding(false);
      setIsAppReady(true);
      return;
    }

    try {
      // 👇 MUDAMOS AQUI: Procuramos pela assinatura, que é a prova real de que o onboarding acabou
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_type_id') 
        .eq('id', currentSession.user.id)
        .single();
        
      if (error || !data) {
        setHasCompletedOnboarding(false);
      } else {
        // Se a coluna subscription_type_id tiver algum dado, o onboarding está concluído!
        setHasCompletedOnboarding(!!data.subscription_type_id);
      }
    } catch (e) {
      console.error("Erro ao checar onboarding:", e);
      setHasCompletedOnboarding(false);
    } finally {
      setIsAppReady(true);
    }
  };

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#F55F16" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding">
            {(props) => <Onboarding {...props} session={session} onComplete={() => setHasCompletedOnboarding(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Training" component={TrainingScreen} />
            <Stack.Screen name="Nutrition" component={NutritionScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="StartTraining" component={StartTrainingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}