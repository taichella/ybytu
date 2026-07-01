import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Dumbbell, Play, Timer } from 'lucide-react-native';
import Navbar from './Navbar';
import { supabase } from '../lib/supabase';

export default function TrainingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  // Aqui você buscará o treino real quando criar a tabela training_plans no Supabase.
  // Por enquanto, deixamos a estrutura perfeita e preparada para receber os dados.
  
  return (
    <SafeAreaView className="flex-1 bg-bgBody">
      <View className="px-6 pt-10 pb-4">
        <Text className="text-3xl font-black uppercase text-textMain tracking-tight">Seu Treino</Text>
        <Text className="text-textMuted font-bold mt-1">Sinergia IA: Treino alinhado com a dieta</Text>
      </View>

      <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color="#F55F16" size="large" className="mt-10" />
        ) : (
          <View className="pb-24">
            
            {/* Card Principal do Treino */}
            <View className="bg-surface p-5 rounded-3xl border border-borderColor mb-6 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-brand font-black text-xs uppercase tracking-widest mb-1">Foco de Hoje</Text>
                  <Text className="text-textMain font-black text-2xl">Full Body Adaptado</Text>
                </View>
                <View className="bg-bgBody p-2 rounded-xl border border-borderColor">
                  <Timer size={20} color="#F55F16" />
                </View>
              </View>

              <TouchableOpacity className="w-full bg-brand py-4 rounded-xl flex-row justify-center items-center gap-2 mt-2">
                <Play size={18} color="#fff" fill="#fff" />
                <Text className="text-white font-black text-lg uppercase">Iniciar Treino</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-textMain font-black text-lg mb-4 uppercase tracking-wider">Exercícios</Text>

            {/* Exemplo de estrutura que a IA vai preencher (mock visual para o layout não quebrar) */}
            {[
               { name: "Agachamento Livre", sets: "3x12", rest: "60s" },
               { name: "Flexão de Braço", sets: "4x10", rest: "45s" },
               { name: "Prancha Abdominal", sets: "3x45s", rest: "30s" }
            ].map((exercise, index) => (
              <View key={index} className="bg-surface p-4 rounded-2xl border border-borderColor mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-12 h-12 bg-bgBody rounded-xl items-center justify-center border border-borderColor">
                    <Dumbbell size={20} color="#9C9C9C" />
                  </View>
                  <View>
                    <Text className="text-textMain font-bold text-base">{exercise.name}</Text>
                    <Text className="text-textMuted font-medium text-xs mt-1">Descanso: {exercise.rest}</Text>
                  </View>
                </View>
                <View className="bg-brand/10 px-3 py-1.5 rounded-lg border border-brand/20">
                  <Text className="text-brand font-black">{exercise.sets}</Text>
                </View>
              </View>
            ))}

          </View>
        )}
      </ScrollView>

      <Navbar activeRoute="Training" navigation={navigation} />
    </SafeAreaView>
  );
}