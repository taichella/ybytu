import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { ArrowLeft, ScanLine, Search, Heart, Plus, Diamond, Circle, Droplet, Pencil } from 'lucide-react-native';
import { supabase } from '../lib/supabase'; // Ajuste o caminho

export default function Meals({ navigation, route }) {
  const mealName = route?.params?.mealName || "Refeição";
  const [activeTab, setActiveTab] = useState('menu');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Busca os alimentos reais do Supabase
  useEffect(() => {
    async function fetchFoods() {
      try {
        setLoading(true);
        let query = supabase.from('meals').select('id, name_ptbr, instruction_pt, calories, protein_g, carbs_g, fat_g').limit(20);
        
        if (searchQuery) {
          query = query.ilike('name_ptbr', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setFoods(data || []);
      } catch (error) {
        console.log("Erro ao buscar alimentos:", error.message);
      } finally {
        setLoading(false);
      }
    }

    // Um pequeno delay para não fazer requisições a cada letra digitada
    const delayDebounceFn = setTimeout(() => {
      fetchFoods();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-bgBody">
      <View className="px-6 pt-8 pb-4 flex-row items-center justify-between z-30">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 rounded-full bg-surface border border-borderColor items-center justify-center"
        >
          <ArrowLeft size={20} color="#DBD9D8" />
        </TouchableOpacity>
        
        <View className="flex-1 px-4">
          <Text className="text-[10px] font-bold text-textMuted uppercase tracking-wide">Trocar opção do</Text>
          <Text className="text-xl font-black uppercase tracking-tight text-brand">{mealName}</Text>
        </View>

        <TouchableOpacity className="w-10 h-10 rounded-full bg-surface border border-borderColor items-center justify-center">
          <ScanLine size={20} color="#DBD9D8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false}>
        <View className="relative flex-row items-center mb-6">
          <View className="absolute left-4 z-10">
            <Search size={20} color="#9C9C9C" />
          </View>
          <TextInput
            placeholder="Buscar alimento ou receita..."
            placeholderTextColor="#9C9C9C"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-surface w-full rounded-2xl py-4 pl-12 pr-4 border border-borderColor text-textMain font-medium"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row border-b border-borderColor mb-6">
          <TouchableOpacity onPress={() => setActiveTab('menu')} className={`pb-3 mr-6 border-b-2 ${activeTab === 'menu' ? 'border-brand' : 'border-transparent'}`}>
            <Text className={`uppercase text-xs tracking-wide ${activeTab === 'menu' ? 'font-black text-brand' : 'font-bold text-textMuted'}`}>Catálogo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('favoritos')} className={`pb-3 mr-6 border-b-2 ${activeTab === 'favoritos' ? 'border-brand' : 'border-transparent'}`}>
            <Text className={`uppercase text-xs tracking-wide ${activeTab === 'favoritos' ? 'font-black text-brand' : 'font-bold text-textMuted'}`}>Favoritos</Text>
          </TouchableOpacity>
        </ScrollView>

        <View className="space-y-3">
          {loading ? (
            <ActivityIndicator color="#F55F16" className="mt-4" />
          ) : foods.length === 0 ? (
            <Text className="text-textMuted text-center font-medium mt-4">Nenhum alimento encontrado.</Text>
          ) : (
            foods.map((food) => (
              <TouchableOpacity key={food.id} className="bg-surface p-4 rounded-3xl border border-borderColor flex-row justify-between items-center mb-3">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-textMain text-base leading-tight">{food.name_ptbr}</Text>
                  
                  {/* Macros com os seus ícones */}
                  <View className="flex-row gap-2 mt-3">
                    <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/10">
                      <Diamond size={10} color="#3b82f6" />
                      <Text className="text-[10px] font-black text-blue-500">{food.protein_g}g</Text>
                    </View>
                    <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-lg bg-green-500/10 border border-green-500/10">
                      <Circle size={10} color="#22c55e" />
                      <Text className="text-[10px] font-black text-green-500">{food.carbs_g}g</Text>
                    </View>
                    <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-500/10">
                      <Droplet size={10} color="#eab308" />
                      <Text className="text-[10px] font-black text-yellow-500">{food.fat_g}g</Text>
                    </View>
                  </View>
                </View>

                <View className="items-end gap-3">
                  <View>
                    <Text className="font-black text-brand text-lg leading-none text-right">{food.calories}</Text>
                    <Text className="text-[10px] font-bold text-textMuted text-right mt-1">KCAL</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="w-8 h-8 rounded-full border border-borderColor bg-bgBody items-center justify-center">
                      <Heart size={16} color="#9C9C9C" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-8 h-8 rounded-full border border-brand bg-brand items-center justify-center">
                      <Plus size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-borderColor items-center justify-center flex-row gap-2 mb-24">
          <Pencil size={16} color="#9C9C9C" />
          <Text className="text-textMuted font-bold">CRIAR ALIMENTO MANUAL</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}