import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ImageBackground } from 'react-native';
import { ArrowLeft, Play, Check, Pause } from 'lucide-react-native';

export default function StartTrainingScreen({ navigation }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Um mock rápido para você ver o layout funcionando. 
  // Quando o banco salvar, puxaremos isso da IA.
  const exercise = {
    name: "Agachamento Livre",
    series: "3x12",
    rest: "60s",
    video_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800" // Imagem provisória simulando o vídeo
  };

  return (
    <View className="flex-1 bg-black">
      {/* VÍDEO VERTICAL (OCUPANDO A TELA TODA) */}
      <ImageBackground 
        source={{ uri: exercise.video_url }} 
        className="flex-1 justify-between p-6 pt-12 pb-10"
        imageStyle={{ opacity: 0.6 }}
      >
        {/* HEADER */}
        <View className="flex-row items-center justify-between z-10">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="w-12 h-12 rounded-full bg-black/50 items-center justify-center backdrop-blur-md"
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View className="bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
            <Text className="text-white font-black uppercase text-xs">Exercício 1 de 5</Text>
          </View>
        </View>

        {/* INFORMAÇÕES DO EXERCÍCIO NA BASE DO VÍDEO */}
        <View className="z-10">
          <Text className="text-brand font-black text-5xl uppercase tracking-tighter mb-2 shadow-black shadow-lg">
            {exercise.name}
          </Text>
          
          <View className="flex-row gap-4 mb-8">
            <View className="bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
              <Text className="text-white font-bold text-lg">{exercise.series} <Text className="text-gray-400 text-sm">Séries</Text></Text>
            </View>
            <View className="bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
              <Text className="text-white font-bold text-lg">{exercise.rest} <Text className="text-gray-400 text-sm">Pausa</Text></Text>
            </View>
          </View>

          {/* BOTÕES DE AÇÃO */}
          <View className="flex-row gap-4">
            <TouchableOpacity 
              onPress={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-white items-center justify-center shadow-xl"
            >
              {isPlaying ? <Pause size={28} color="#000" fill="#000" /> : <Play size={28} color="#000" fill="#000" className="ml-1" />}
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-brand rounded-full items-center justify-center flex-row gap-2 shadow-xl shadow-brand/30"
              onPress={() => alert("Série concluída! Avançando...")}
            >
              <Check size={24} color="#fff" strokeWidth={3} />
              <Text className="text-white font-black text-xl uppercase">Concluir Série</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}