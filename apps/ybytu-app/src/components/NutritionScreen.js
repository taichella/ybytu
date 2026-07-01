import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Utensils } from 'lucide-react-native';
import Navbar from './Navbar';
import { supabase } from '../lib/supabase';

export default function NutritionScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [dietDays, setDietDays] = useState({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [planInfo, setPlanInfo] = useState(null);

  useEffect(() => {
    async function fetchDiet() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Busca o plano atribuído ao utilizador
        const { data: userPlan, error: userPlanError } = await supabase
          .from('user_meal_plans')
          .select('meal_plan_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (userPlanError || !userPlan) throw new Error("Sem plano");

        // 2. Busca o nome do plano
        const { data: planDetails } = await supabase
          .from('meal_plans')
          .select('name_ptbr')
          .eq('id', userPlan.meal_plan_id)
          .single();
          
        if (planDetails) setPlanInfo(planDetails);

        // 3. A Query Mágica com Joins na tabela ponte
        const { data: foods, error: foodsError } = await supabase
          .from('meal_plan_meals')
          .select(`
            day_order,
            meal_order,
            meal_types ( name_ptbr ),
            meals ( name_ptbr, calories, protein_g, carbs_g, fat_g, prep_time_min )
          `)
          .eq('meal_plan_id', userPlan.meal_plan_id)
          .order('day_order', { ascending: true })
          .order('meal_order', { ascending: true });

        if (foodsError) throw foodsError;

        // 4. Agrupa os dados por Dia
        const groupedByDay = {};
        foods.forEach(item => {
          const dia = item.day_order;
          if (!groupedByDay[dia]) groupedByDay[dia] = [];
          groupedByDay[dia].push(item);
        });

        setDietDays(groupedByDay);
        const firstAvailableDay = Object.keys(groupedByDay)[0];
        if (firstAvailableDay) setSelectedDay(parseInt(firstAvailableDay));

      } catch (error) {
        console.log("Erro ao carregar dieta:", error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDiet();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bgBody">
      <View className="px-6 pt-10 pb-4">
        <Text className="text-3xl font-black uppercase text-textMain tracking-tight">Sua Dieta</Text>
        <Text className="text-textMuted font-bold mt-1">Criada pela Inteligência Artificial</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#F55F16" size="large" className="mt-10" />
      ) : Object.keys(dietDays).length === 0 ? (
        <View className="items-center justify-center flex-1">
          <Utensils size={48} color="#2A2A2A" />
          <Text className="text-textMuted font-bold mt-4 text-center px-8">
            Nenhuma dieta encontrada. Refaça o Onboarding para gerar o seu plano!
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Menu de Dias */}
          <View className="border-b border-borderColor mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-6 py-2">
              {Object.keys(dietDays).map((dia) => {
                const isSelected = selectedDay === parseInt(dia);
                return (
                  <TouchableOpacity 
                    key={dia} 
                    onPress={() => setSelectedDay(parseInt(dia))}
                    className={`mr-3 px-5 py-2 rounded-full border ${isSelected ? 'bg-brand border-brand' : 'bg-surface border-borderColor'}`}
                  >
                    <Text className={`font-bold uppercase tracking-wider text-xs ${isSelected ? 'text-white' : 'text-textMuted'}`}>
                      Dia {dia}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView className="flex-1 px-6 pb-24" showsVerticalScrollIndicator={false}>
            <View className="bg-brand/10 p-4 rounded-2xl border border-brand/20 mb-6 items-center">
              <Text className="text-brand font-black text-lg uppercase text-center">{planInfo?.name_ptbr}</Text>
            </View>

            {dietDays[selectedDay]?.map((item, index) => {
              const mealType = item.meal_types?.name_ptbr || "Refeição";
              const food = item.meals;

              return (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => navigation.navigate('Meals', { mealName: mealType })} // 👈 Clica e abre a tela de busca!
                  className="bg-surface p-5 rounded-2xl border border-borderColor mb-4 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-3 border-b border-borderColor/50 pb-2">
                     <Text className="text-brand font-black uppercase tracking-wider text-sm">{mealType}</Text>
                     <Text className="text-textMuted font-bold text-xs">{item.meal_order}ª Refeição</Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-textMain font-black text-xl flex-1 pr-2">{food?.name_ptbr}</Text>
                    <Text className="text-textMain font-black text-lg bg-bgBody px-2 py-1 rounded-md border border-borderColor">
                      {food?.calories} kcal
                    </Text>
                  </View>

                  <View className="flex-row gap-2 mt-2">
                    <Text className="text-textMuted font-medium text-xs bg-bgBody px-2 py-1 rounded-md">P: {food?.protein_g}g</Text>
                    <Text className="text-textMuted font-medium text-xs bg-bgBody px-2 py-1 rounded-md">C: {food?.carbs_g}g</Text>
                    <Text className="text-textMuted font-medium text-xs bg-bgBody px-2 py-1 rounded-md">G: {food?.fat_g}g</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <View className="h-24" />
          </ScrollView>
        </View>
      )}

      <Navbar activeRoute="Nutrition" navigation={navigation} />
    </SafeAreaView>
  );
}