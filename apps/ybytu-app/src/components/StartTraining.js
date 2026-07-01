import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { ArrowLeft, Clock, Flame, Info, Repeat, Timer, Play } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av'; 
import { supabase } from '../lib/supabase'; // Conexão real com o banco

export default function StartTraining({ navigation }) {
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  // BUSCA REAL DE DADOS DO SUPABASE
  useEffect(() => {
    async function fetchRealWorkout() {
      try {
        // 1. Pegar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        // 2. Descobrir qual o plano de treino gerado para ele
        const { data: profile } = await supabase
          .from('profiles')
          .select('training_plan_id')
          .eq('id', user.id)
          .single();

        if (profile?.training_plan_id) {
          // 3. Buscar os exercícios amarrados a esse plano. 
          // ATENÇÃO: Ajuste os nomes das tabelas ('training_exercises' e 'exercises') caso no seu banco estejam com nomes diferentes.
          const { data: planData, error } = await supabase
            .from('training_exercises') // <-- Sua tabela de ligação de exercícios do treino
            .select(`
              series,
              rest,
              exercises (
                id,
                name,
                category,
                video_url
              )
            `)
            .eq('training_id', profile.training_plan_id);

          if (planData) {
            // Formata o dado para a tela ler facilmente
            const formattedExercises = planData.map(item => ({
              id: item.exercises.id,
              name: item.exercises.name,
              category: item.exercises.category || 'Exercício',
              videoUrl: item.exercises.video_url,
              series: item.series || '3x10',
              rest: item.rest || '45s'
            }));
            
            setExercises(formattedExercises);
          }
        }
      } catch (error) {
        console.log("Erro ao carregar treino real:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRealWorkout();
  }, []);

  const handlePlayVideo = (id) => {
    setPlayingVideoId(playingVideoId === id ? null : id);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-bgBody justify-center items-center">
        <ActivityIndicator size="large" color="#F55F16" />
        <Text className="text-textMuted mt-4 font-bold">Carregando seu treino...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bgBody">
      
      {/* HEADER HERO IMAGE */}
      <View className="relative h-64 w-full">
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} 
          className="w-full h-full justify-end p-6"
        >
          <View className="absolute inset-0 bg-black/40" />
          
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="absolute top-12 left-6 w-10 h-10 rounded-full bg-black/40 items-center justify-center z-30"
          >
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>

          <View className="z-10">
            <View className="bg-brand self-start px-2 py-1 rounded mb-2">
              <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Seu Plano</Text>
            </View>
            <Text className="text-3xl font-black text-white uppercase leading-none mb-3">Treino de Hoje</Text>
          </View>
        </ImageBackground>
      </View>

      {/* LISTA DE EXERCÍCIOS REAIS DO BANCO */}
      <ScrollView className="flex-1 px-6 pt-6 mb-24" showsVerticalScrollIndicator={false}>
        
        {exercises.length === 0 ? (
          <Text className="text-textMuted text-center mt-10 font-bold text-lg">Nenhum exercício encontrado para este plano.</Text>
        ) : (
          exercises.map((exercise) => {
            const isPlaying = playingVideoId === exercise.id;

            return (
              <View key={exercise.id} className="bg-surface p-3 rounded-2xl border border-borderColor mb-4 flex-row gap-4">
                
                {/* VIDEO PLAYER NATIVO */}
                <TouchableOpacity 
                  onPress={() => handlePlayVideo(exercise.id)}
                  className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-900 justify-center items-center"
                >
                  {exercise.videoUrl ? (
                    <Video
                      source={{ uri: exercise.videoUrl }}
                      className="w-full h-full absolute"
                      useNativeControls={false}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={isPlaying}
                      isLooping
                    />
                  ) : (
                    <Text className="text-white text-xs">Sem Vídeo</Text>
                  )}

                  {!isPlaying && exercise.videoUrl && (
                    <View className="w-8 h-8 rounded-full bg-black/50 items-center justify-center z-10">
                      <Play color="white" size={16} fill="white" className="ml-0.5" />
                    </View>
                  )}
                </TouchableOpacity>
                
                <View className="flex-1 justify-center">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="font-bold text-lg leading-tight text-textMain">{exercise.name}</Text>
                      <Text className="text-xs text-textMuted mt-1">{exercise.category}</Text>
                    </View>
                    <TouchableOpacity>
                      <Info color="#9C9C9C" size={20} />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1 bg-bgBody px-2 py-1 rounded-lg">
                      <Repeat color="#F55F16" size={12} />
                      <Text className="text-xs font-bold text-textMain">{exercise.series}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 bg-bgBody px-2 py-1 rounded-lg">
                      <Timer color="#3b82f6" size={12} />
                      <Text className="text-xs font-bold text-textMain">{exercise.rest}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View className="h-10" />
      </ScrollView>

      {/* FIXED START BUTTON */}
      {exercises.length > 0 && (
        <View className="absolute bottom-0 w-full bg-surface border-t border-borderColor p-6 pb-8 z-50">
          <TouchableOpacity className="w-full bg-brand py-4 rounded-xl shadow-lg flex-row items-center justify-center gap-2">
            <Text className="text-white font-black text-lg uppercase">Iniciar Treino</Text>
            <Play color="white" size={20} fill="white" />
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}