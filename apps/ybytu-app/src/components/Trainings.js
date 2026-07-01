import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Target, Play, ChevronRight, Activity, Lightbulb } from 'lucide-react-native';

// Caminhos Corrigidos! 👇
import Topbar from './Topbar';
import Navbar from './Navbar';
// 👇 AQUI ESTÁ A CORREÇÃO (Dois pontos para voltar uma pasta)
import { supabase } from '../lib/supabase';

export default function Trainings({ navigation }) {
  const [userName, setUserName] = useState('...');

  // 1. O Efeito que busca o nome do usuário no banco de dados
  useEffect(() => {
    async function fetchProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name') 
            .eq('id', user.id)
            .single();

          if (data && data.full_name) {
            const firstName = data.full_name.split(' ')[0];
            setUserName(firstName);
          } else {
            setUserName('Usuário');
          }
        }
      } catch (error) {
        console.log("Erro ao buscar nome:", error);
        setUserName('Usuário');
      }
    }
    fetchProfileData();
  }, []);

  return (
    <View className="flex-1 bg-bgBody pb-24">
      
      {/* 2. Topbar recebendo o nome dinâmico para gerar o Avatar com as iniciais */}
      <Topbar subtitle="Biblioteca" title="Treinos" userName={userName} />

      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
        
        {/* BIG CARD DE METAS */}
        <View className="bg-surface p-6 rounded-3xl border border-borderColor shadow-sm relative overflow-hidden mb-6">
          <View className="absolute right-[-10] top-[-10] w-32 h-32 bg-brand/10 rounded-bl-full" />
          
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="font-black text-xl uppercase tracking-tight text-textMain">Meta da Semana</Text>
              <Text className="text-textMuted text-xs font-bold mt-1">Consistência é a chave!</Text>
            </View>
            <View className="p-2 bg-brand rounded-xl">
              <Target color="white" size={24} />
            </View>
          </View>
          
          <View className="flex-row items-end gap-2 mb-2">
            <Text className="text-4xl font-black text-brand leading-none">3</Text>
            <Text className="text-lg font-bold text-textMuted mb-1">de 4 treinos</Text>
          </View>
          
          <View className="h-3 w-full bg-bgBody rounded-full overflow-hidden border border-borderColor/50">
            <View className="h-full bg-brand w-[75%] rounded-full" />
          </View>
          <Text className="text-right text-[10px] font-bold text-brand mt-2 uppercase">75% Concluído</Text>
        </View>

        {/* MEUS TREINOS */}
        <View className="mb-6">
          <Text className="font-black text-lg uppercase tracking-tight text-textMain mb-4">Meus Treinos</Text>
          
          {/* Split Item A */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('StartTraining')}
            className="bg-surface p-4 rounded-2xl flex-row items-center gap-4 border border-borderColor mb-4"
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' }} 
              className="w-16 h-16 rounded-xl bg-gray-800" 
            />
            <View className="flex-1">
              <Text className="font-bold text-lg text-textMain">Inferiores & Glúteo</Text>
              <Text className="text-xs text-textMuted mt-1">Foco em tonificação</Text>
              <View className="self-start bg-bgBody px-2 py-1 rounded mt-2">
                <Text className="text-[10px] font-bold text-textMuted">45 min</Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-brand/10 items-center justify-center">
              <Play color="#F55F16" size={16} fill="#F55F16" className="ml-1" />
            </View>
          </TouchableOpacity>

          {/* Split Item B */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('StartTraining')}
            className="bg-surface p-4 rounded-2xl flex-row items-center gap-4 border border-borderColor mb-2"
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80' }} 
              className="w-16 h-16 rounded-xl bg-gray-800" 
            />
            <View className="flex-1">
              <Text className="font-bold text-lg text-textMain">Core & Cardio</Text>
              <Text className="text-xs text-textMuted mt-1">Resistência</Text>
              <View className="self-start bg-bgBody px-2 py-1 rounded mt-2">
                <Text className="text-[10px] font-bold text-textMuted">30 min</Text>
              </View>
            </View>
            <ChevronRight color="#9C9C9C" size={20} />
          </TouchableOpacity>
        </View>

        {/* EXPLORAR */}
        <View className="mb-8">
          <Text className="font-black text-lg uppercase tracking-tight text-textMain mb-4">Explorar</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 h-32 bg-surface rounded-2xl border border-borderColor overflow-hidden justify-end">
              <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1544367563-121910aa662f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }} 
                className="absolute inset-0 opacity-50"
              />
              <View className="p-3">
                <View className="bg-brand w-8 h-8 rounded-full items-center justify-center mb-2">
                  <Activity color="white" size={16} />
                </View>
                <Text className="font-bold text-white uppercase text-sm shadow-md">Alongamentos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 h-32 bg-surface rounded-2xl border border-borderColor overflow-hidden justify-end">
              <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }} 
                className="absolute inset-0 opacity-50"
              />
              <View className="p-3">
                <View className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center mb-2">
                  <Lightbulb color="white" size={16} />
                </View>
                <Text className="font-bold text-white uppercase text-sm shadow-md">Dicas</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <Navbar activeRoute="Trainings" navigation={navigation} />
    </View>
  );
}