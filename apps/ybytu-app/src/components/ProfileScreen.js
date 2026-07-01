import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Settings, User, ChevronRight, LogOut, ArrowLeft, Target, CreditCard } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import Navbar from './Navbar';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    name: '',
    workouts: 0,
    meals: 0,
    calories: 0,
    isPro: false
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  async function fetchRealStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca nome, sobrenome e status do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, full_name, onboarding_completed')
        .eq('id', user.id)
        .single();

      // 2. Conta total de treinos concluídos REAL
      const { count: workoutCount } = await supabase
        .from('completed_workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 3. Conta total de refeições concluídas REAL
      const { count: mealCount } = await supabase
        .from('completed_meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 4. Soma calorias (exemplo simples de soma no banco)
      const { data: mealsData } = await supabase
        .from('completed_meals')
        .select('calories_consumed')
        .eq('user_id', user.id);
      
      const totalCalories = mealsData?.reduce((acc, curr) => acc + (curr.calories_consumed || 0), 0) || 0;

      // Monta o nome certinho (junta o nome e sobrenome, ou usa o full_name)
      const displayName = profile?.first_name 
        ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
        : profile?.full_name || 'Atleta';

      setStats({
        name: displayName,
        workouts: workoutCount || 0,
        meals: mealCount || 0,
        calories: totalCalories,
        isPro: profile?.onboarding_completed || false
      });

    } catch (error) {
      console.error("Erro ao buscar stats reais:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return <SafeAreaView className="flex-1 bg-bgBody justify-center"><ActivityIndicator color="#F55F16" /></SafeAreaView>;

  return (
    <SafeAreaView className="flex-1 bg-bgBody">
      {/* Header Visual - MANTIDO ORIGINAL */}
      <View className="w-full h-40 bg-brand/10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-8 left-6 p-2 bg-black/10 rounded-full z-10">
          <ArrowLeft size={24} color="#DBD9D8" />
        </TouchableOpacity>
        <TouchableOpacity className="absolute top-8 right-6 p-2 bg-black/10 rounded-full">
          <Settings size={24} color="#DBD9D8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 -mt-16" showsVerticalScrollIndicator={false}>
        {/* Avatar Area */}
        <View className="items-center">
          <View className="relative w-32 h-32 items-center justify-center">
            <View className="w-[110px] h-[110px] rounded-full border-4 border-bgBody overflow-hidden bg-brand">
               <View className="flex-1 items-center justify-center bg-brand/50"><User size={40} color="#fff" /></View>
            </View>
            <View className="absolute bottom-2 right-2 bg-bgBody rounded-full p-1 border border-borderColor">
              <View className="bg-brand px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">Lvl 1</Text>
              </View>
            </View>
          </View>
          {/* NOME REAL DO USUÁRIO */}
          <Text className="text-2xl font-black uppercase mt-4 text-textMain">{stats.name}</Text>
          <Text className="text-textMuted text-sm font-medium">{stats.isPro ? 'Membro Premium' : 'Membro Free'}</Text>
        </View>

        {/* Grid de Stats - AGORA COM DADOS DO BANCO */}
        <View className="flex-row justify-between mt-8 mb-8">
          <View className="flex-1 bg-surface p-3 rounded-2xl border border-borderColor items-center mr-2">
            <Text className="text-xl font-black text-brand">{stats.workouts}</Text>
            <Text className="text-[10px] font-bold text-textMuted uppercase">Treinos</Text>
          </View>
          <View className="flex-1 bg-surface p-3 rounded-2xl border border-borderColor items-center mr-2">
            <Text className="text-xl font-black text-blue-500">{stats.meals}</Text>
            <Text className="text-[10px] font-bold text-textMuted uppercase">Refeições</Text>
          </View>
          <View className="flex-1 bg-surface p-3 rounded-2xl border border-borderColor items-center">
            <Text className="text-xl font-black text-green-500">{stats.calories}</Text>
            <Text className="text-[10px] font-bold text-textMuted uppercase">Kcal</Text>
          </View>
        </View>

        {/* Menu de Opções - MANTIDO ORIGINAL */}
        <View className="space-y-3 mb-8">
          <TouchableOpacity className="w-full p-4 bg-surface rounded-2xl flex-row justify-between items-center border border-borderColor mb-3">
            <View className="flex-row items-center gap-3">
              <View className="p-2 rounded-lg bg-bgBody"><User size={20} color="#F55F16" /></View>
              <Text className="font-bold text-sm text-textMain">Dados Corporais</Text>
            </View>
            <ChevronRight size={20} color="#9C9C9C" />
          </TouchableOpacity>
          
          <TouchableOpacity className="w-full p-4 bg-surface rounded-2xl flex-row justify-between items-center border border-borderColor mb-3">
            <View className="flex-row items-center gap-3">
              <View className="p-2 rounded-lg bg-bgBody"><Target size={20} color="#F55F16" /></View>
              <Text className="font-bold text-sm text-textMain">Minhas Metas</Text>
            </View>
            <ChevronRight size={20} color="#9C9C9C" />
          </TouchableOpacity>

          <TouchableOpacity className="w-full p-4 bg-surface rounded-2xl flex-row justify-between items-center border border-borderColor">
            <View className="flex-row items-center gap-3">
              <View className="p-2 rounded-lg bg-bgBody"><CreditCard size={20} color="#F55F16" /></View>
              <Text className="font-bold text-sm text-textMain">Assinatura</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="bg-brand/10 px-2 py-1 rounded">
                <Text className="text-[10px] font-bold text-brand">{stats.isPro ? 'Pro' : 'Free'}</Text>
              </View>
              <ChevronRight size={20} color="#9C9C9C" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} className="w-full py-4 flex-row items-center justify-center gap-2 mb-24">
          <LogOut size={16} color="#ef4444" />
          <Text className="text-red-500 font-bold text-sm">Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <Navbar activeRoute="Profile" navigation={navigation} />
    </SafeAreaView>
  );
}