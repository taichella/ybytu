import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { Flame, CheckCircle, ChevronRight, Play } from 'lucide-react-native';
import Topbar from './Topbar';
import Navbar from './Navbar';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. BUSCA O NOME REAL: Procura no Profile e nos Metadados da conta
        const { data: profile } = await supabase.from('profiles').select('full_name, name').eq('id', user.id).single();
        
        // Pega o primeiro nome válido que encontrar, sem usar mocks!
        const realName = profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
        
        if (realName) {
          setUserName(realName.split(' ')[0]); // Pega só o primeiro nome
        } else {
          setUserName(''); // Se não achar de jeito nenhum, fica vazio.
        }

        // 2. BUSCA A DIETA REAL GERADA PELA IA
        const { data: plan } = await supabase.from('meal_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
        if (plan) {
          setDietPlan(plan);
        }
      } catch (error) {
        console.log("Erro ao buscar dados reais:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRealData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-bgBody justify-center items-center">
        <ActivityIndicator color="#F55F16" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bgBody pb-24">
      {/* NOME VERDADEIRO INJETADO NO TOPBAR */}
      <Topbar subtitle="Bem-vinda," title={userName} userName={userName} />

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
          <View className="bg-surface p-4 rounded-2xl flex-col items-start gap-2 border border-borderColor mr-3 min-w-[140px]">
            <View className="w-8 h-8 rounded-full bg-orange-500/10 items-center justify-center"><Flame size={16} color="#f97316" /></View>
            <View>
              <Text className="text-2xl font-black text-textMain leading-none">0</Text>
              <Text className="text-[10px] font-bold text-textMuted uppercase">Dias Seguidos</Text>
            </View>
          </View>
          <View className="bg-surface p-4 rounded-2xl flex-col items-start gap-2 border border-borderColor mr-3 min-w-[140px]">
            <View className="w-8 h-8 rounded-full bg-green-500/10 items-center justify-center"><CheckCircle size={16} color="#22c55e" /></View>
            <View>
              <Text className="text-2xl font-black text-textMain leading-none">0/1</Text>
              <Text className="text-[10px] font-bold text-textMuted uppercase">Treinos Hoje</Text>
            </View>
          </View>
        </ScrollView>

        <View className="mb-8 flex-col items-center">
          <View className="w-full flex-row justify-between items-center mb-3">
            <Text className="font-black text-lg uppercase tracking-tight text-textMain">Seu Plano</Text>
          </View>
          
          <TouchableOpacity onPress={() => navigation.navigate('StartTraining')} className="w-full max-w-[280px] bg-surface rounded-[32px] p-2 border border-borderColor shadow-lg overflow-hidden">
            <View className="relative h-96 rounded-[24px] overflow-hidden bg-gray-900 w-full">
              <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }} className="w-full h-full justify-end p-5" resizeMode="cover">
                <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <View className="z-10">
                  <View className="bg-brand self-start px-3 py-1.5 rounded-lg mb-3 shadow-md">
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">IA Gerou</Text>
                  </View>
                  <View className="flex-row justify-between items-end">
                    <Text className="text-white font-black text-3xl leading-tight w-2/3">Treino do Dia</Text>
                    <View className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-2xl mb-1">
                      <Play size={24} color="#000" fill="#000" className="ml-1" />
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Nutrition')} className="bg-surface p-5 rounded-3xl border border-borderColor mb-8 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-black text-lg uppercase tracking-tight text-textMain">Nutrição: {dietPlan ? dietPlan.title : 'Sem dieta'}</Text>
            <View className="w-8 h-8 rounded-full border border-borderColor items-center justify-center bg-bgBody"><ChevronRight size={16} color="#9C9C9C" /></View>
          </View>
          <View className="flex-row items-center gap-6">
            <View className="w-24 h-24 rounded-full bg-brand items-center justify-center shadow-md">
               <View className="w-20 h-20 rounded-full bg-surface items-center justify-center">
                  <Text className="text-xl font-black text-textMain">0</Text>
                  <Text className="text-[9px] font-bold text-textMuted uppercase">Consumidas</Text>
               </View>
            </View>
            <View className="flex-1 space-y-3">
              <Text className="text-textMuted font-bold text-xs leading-5">Vá para a aba Dieta para ver os alimentos sugeridos pela IA e começar a marcar o que você já comeu hoje!</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>

      <Navbar activeRoute="Home" navigation={navigation} />
    </View>
  );
}