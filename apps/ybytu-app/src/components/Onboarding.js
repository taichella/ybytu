import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import Slider from '@react-native-community/slider';

// ==========================================================
// A FONTE ÚNICA DE VERDADE PARA OS PLANOS
// ==========================================================
const SUBSCRIPTION_PLANS = {
  TRAINING: '3a5ccc00-77ed-4b87-8e83-bc35be63a862',
  MEAL: '7458939c-ed4b-4a16-960e-b647f94e6a9b',
  COMPLETE: '7b5502f1-eeed-4640-8c4f-0ebc0502481e',
};

export function Onboarding({ session, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || 'Utilizador';

  // Helper blindado para verificação de condições
  const checkCondition = (currentAnswers, stepsData, field, matchTerm) => {
    const step = stepsData.find(s => s.dbField === field);
    if (!step || !step.options) return false;
    
    const target = step.options.find(o => 
      String(o.name_ptbr || o.name || '').toLowerCase().includes(matchTerm.toLowerCase()) ||
      String(o.id).toLowerCase() === matchTerm.toLowerCase()
    );
    if (!target) return false;

    const selection = currentAnswers[field];
    if (!selection) return false;

    return Array.isArray(selection) ? selection.includes(target.id) : selection === target.id;
  };

  const [steps, setSteps] = useState([
    { 
      id: 'plan_selection', 
      title: "Como vamos transformar a sua vida?", 
      subtitle: "Escolha o plano ideal para si", 
      type: 'single', 
      dbField: 'subscription_type_id', 
      options: [
        { id: SUBSCRIPTION_PLANS.TRAINING, name_ptbr: '💪 Apenas Treinos' },
        { id: SUBSCRIPTION_PLANS.MEAL, name_ptbr: '🥗 Apenas Nutrição' },
        { id: SUBSCRIPTION_PLANS.COMPLETE, name_ptbr: '🏆 Treino + Nutrição (Completo)' }
      ]
    },
    { 
      id: 'goals', 
      title: "Qual é o seu principal objetivo?", 
      subtitle: "Múltipla escolha", 
      type: 'multiple', 
      dbField: 'goals_ids', 
      table: 'goals',
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'gender', 
      title: "Qual o seu género?", 
      subtitle: "Escolha única", 
      type: 'single', 
      dbField: 'gender_id', 
      table: 'genders',
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'age', 
      title: "Qual a sua idade?", 
      subtitle: "Digite a sua idade", 
      type: 'number', 
      dbField: 'age', placeholder: "Ex: 38",
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'weight', 
      title: "Qual o seu peso atual?", 
      subtitle: "Peso em kg", type: 'number', 
      dbField: 'weight_kg', placeholder: "Ex: 70",
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'height', 
      title: "Qual a sua altura?", 
      subtitle: "Altura em cm", 
      type: 'number', 
      dbField: 'height_cm', 
      placeholder: "Ex: 155",
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'activity_level', 
      title: "Considera-se uma pessoa ativa?", 
      subtitle: "Escolha única", type: 'single', 
      dbField: 'activity_level_id', table: 'activity_levels',
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'health_conditions', 
      title: "Possui alguma condição de saúde?", 
      subtitle: "Múltipla escolha", 
      type: 'multiple', 
      dbField: 'health_conditions_ids', 
      table: 'health_conditions',
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'pregnancy_trimester', 
      title: "Em qual trimestre da gestação está?", 
      subtitle: "Escolha única", 
      type: 'single', 
      dbField: 'pregnancy_trimester', 
      options: [{ id: 1, name_ptbr: '1º trimestre' }, { id: 2, name_ptbr: '2º trimestre' }, { id: 3, name_ptbr: '3º trimestre' }],
      condition: (ans, stp) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id) && checkCondition(ans, stp, 'health_conditions_ids', 'Gravidez')
    },

    // ==========================================================
    // ETAPAS DE TREINO (Apenas Treino ou Completo)
    // ==========================================================
    { 
      id: 'physical_conditions', 
      title: "Possui alguma dor ou limitação física?", 
      subtitle: "Múltipla escolha", 
      type: 'multiple', 
      dbField: 'physical_conditions_ids', 
      table: 'onboarding_physical_conditions', 
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'muscle_groups', 
      title: "Qual parte do corpo gostaria de focar?", 
      subtitle: "Múltipla escolha", type: 'multiple', 
      dbField: 'muscle_groups_ids', 
      table: 'onboarding_muscle_groups',
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'exercise_environment', 
      title: "Onde pretende treinar?", 
      subtitle: "Escolha única", 
      type: 'single', 
      dbField: 'exercise_environment_id', 
      table: 'exercise_environment',
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'exercise_equipments', 
      title: "Que equipamentos possui?", 
      subtitle: "Múltipla escolha", 
      type: 'multiple', 
      dbField: 'exercise_equipment_ids', 
      table: 'onboarding_exercise_equipments', 
      condition: (answers, stepsData) => {
        const isTrainingPlan = [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(answers.subscription_type_id);
        const environmentAnswer = answers.exercise_environment_id;
        if (!environmentAnswer) return false;

        const environmentStep = stepsData.find(step => step.dbField === 'exercise_environment_id');
        const chosenOption = environmentStep?.options?.find(opt => opt.id === environmentAnswer);

        const selectedHomeWithEquipment = 
          environmentAnswer === 'home_with_equipment' || 
          (chosenOption && Object.values(chosenOption).some(value => String(value).includes('home_with_equipment')));

        return isTrainingPlan && selectedHomeWithEquipment;
      }
    },
    { 
      id: 'training_days_per_week', 
      title: "Quantos dias por semana pretende treinar?", 
      subtitle: "Escolha única", type: 'single', 
      dbField: 'training_days_per_week', 
      options: [{id: 2, name_ptbr: '2 dias'}, {id: 3, name_ptbr: '3 dias'}, {id: 4, name_ptbr: '4 dias'}, {id: 5, name_ptbr: '5 dias'}, {id: 6, name_ptbr: '6 dias'}, {id: 7, name_ptbr: '7 dias'}],
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'training_duration_minutes', 
      title: "Quanto tempo tem por treino?", 
      subtitle: "Deslize para definir o tempo", 
      type: 'slider', 
      dbField: 'training_duration_minutes', min: 15, max: 90, step: 15, recommended: 45,
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'exercise_level', 
      title: "Qual a sua experiência com treinos?", 
      subtitle: "Escolha única", 
      type: 'single', 
      dbField: 'exercise_level_id', 
      table: 'exercise_levels',
      condition: (ans) => [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },

    // ==========================================================
    // ETAPAS DE NUTRIÇÃO (Apenas Nutrição ou Completo)
    // ==========================================================
    { 
      id: 'nutrition_days_per_week', 
      title: "Quantos dias por semana pretende seguir a dieta?", 
      subtitle: "Escolha única", 
      type: 'single', 
      dbField: 'nutrition_days_per_week', 
      options: [{id: 2, name_ptbr: '2 dias'}, {id: 3, name_ptbr: '3 dias'}, {id: 4, name_ptbr: '4 dias'}, {id: 5, name_ptbr: '5 dias'}, {id: 6, name_ptbr: '6 dias'}, {id: 7, name_ptbr: '7 dias (A semana toda)'}],
      condition: (ans) => [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'meals_per_day', 
      title: "Quantas refeições prefere fazer por dia?", 
      subtitle: "Escolha única", 
      type: 'single', 
      dbField: 'meals_per_day', 
      options: [
        {id: 3, name_ptbr: '3 refeições (Ex: Pequeno-almoço, Almoço, Jantar)'}, 
        {id: 4, name_ptbr: '4 refeições (+ 1 Lanche)'}, 
        {id: 5, name_ptbr: '5 refeições (+ 2 Lanches)'}, 
        {id: 6, name_ptbr: '6 refeições (Comer de 3 em 3 horas)'}
      ],
      condition: (ans) => [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'dietary_preferences', 
      title: "Qual opção define melhor sua alimentação?", 
      subtitle: "Escolha única", 
      type: 'single', 
      dbField: 'dietary_preference_id', 
      table: 'dietary_preferences', 
      condition: (ans) => [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'dietary_restrictions', 
      title: "Possui alguma restrição ou intolerância alimentar?", 
      subtitle: "Múltipla escolha", 
      type: 'multiple', 
      dbField: 'dietary_restrictions_ids', 
      table: 'dietary_restrictions', 
      condition: (ans) => [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    },
    { 
      id: 'disliked_foods', 
      title: "Existe algum alimento que prefere evitar?", 
      subtitle: "Deixe em branco se comer de tudo", 
      type: 'text', 
      dbField: 'disliked_foods', 
      placeholder: "Ex: fígado, cebola, brócolis…",
      condition: (ans) => [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(ans.subscription_type_id)
    }
  ]);

  useEffect(() => {
    async function fetchAllOptions() {
      try {
        const updatedSteps = await Promise.all(steps.map(async (step) => {
          if (step.table) {
            const { data, error } = await supabase.from(step.table).select('*');
            if (error || !data) return step;
            return {
              ...step,
              options: data.map(item => ({
                ...item, 
                id: item.id || item[Object.keys(item).find(k => k.includes('id'))],
                name_ptbr: item.name_ptbr || item.label_ptbr || item.name || item.title,
                name: item.name_ptbr || item.label_ptbr || item.name || item.title
              }))
            };
          }
          return step;
        }));
        setSteps(updatedSteps);
      } catch (e) { 
        console.error("Erro na busca das opções:", e); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchAllOptions();
  }, []);

  const visibleSteps = useMemo(() => steps.filter(step => step.condition ? step.condition(answers, steps) : true), [answers, steps]);

  const handleSelect = (optionId) => {
    const field = visibleSteps[currentStep].dbField;
    if (visibleSteps[currentStep].type === 'multiple') {
      const selections = answers[field] || [];
      setAnswers({ ...answers, [field]: selections.includes(optionId) ? selections.filter(i => i !== optionId) : [...selections, optionId] });
    } else {
      setAnswers({ ...answers, [field]: optionId });
    }
  };

  const nextStep = async () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      try {
        if (!session?.user?.id) throw new Error("Utilizador não autenticado.");
        const userId = session.user.id;

        // ====================================================================
        // PASSO 1: GUARDAR TODOS OS DADOS NA TABELA PROFILES
        // ====================================================================
        const { error: profileError } = await supabase.from('profiles').update({
          subscription_type_id: answers.subscription_type_id, 
          
          goals_ids: answers.goals_ids || [], 
          gender_id: answers.gender_id || null,
          age: answers.age ? parseInt(answers.age) : null,
          weight_kg: answers.weight_kg ? parseFloat(answers.weight_kg) : null,
          height_cm: answers.height_cm ? parseInt(answers.height_cm) : null,
          activity_level_id: answers.activity_level_id || null,
          health_conditions_ids: answers.health_conditions_ids || [], 
          pregnancy_trimester: answers.pregnancy_trimester ? parseInt(answers.pregnancy_trimester) : null, 
          
          physical_conditions_ids: answers.physical_conditions_ids || [], 
          muscle_groups_ids: answers.muscle_groups_ids || [],
          exercise_environment_id: answers.exercise_environment_id || null, 
          exercise_equipments_ids: answers.exercise_equipment_ids || [], 
          training_days_per_week: answers.training_days_per_week ? parseInt(answers.training_days_per_week) : null, 
          training_duration_minutes: answers.training_duration_minutes || null, 
          exercise_level_id: answers.exercise_level_id || null,

          nutrition_days_per_week: answers.nutrition_days_per_week ? parseInt(answers.nutrition_days_per_week) : null,
          meals_per_day: answers.meals_per_day ? parseInt(answers.meals_per_day) : null,
          dietary_preference_id: answers.dietary_preference_id || null,
          dietary_restrictions_ids: answers.dietary_restrictions_ids || [],
          disliked_foods: answers.disliked_foods || null,

        }).eq('id', userId);

        if (profileError) throw new Error(`Erro ao guardar perfil: ${profileError.message}`);

        // ====================================================================
        // PASSO 2: DISPARAR AS INTELIGÊNCIAS ARTIFICIAIS EM PARALELO
        // ====================================================================
        const isTraining = [SUBSCRIPTION_PLANS.TRAINING, SUBSCRIPTION_PLANS.COMPLETE].includes(answers.subscription_type_id);
        const isMeal = [SUBSCRIPTION_PLANS.MEAL, SUBSCRIPTION_PLANS.COMPLETE].includes(answers.subscription_type_id);

        const aiPromises = []; 

        if (isTraining) {
          aiPromises.push(
            supabase.functions.invoke('ybytu-generate-training-plan')
              .then(({ error }) => {
                if (error) throw new Error("Aviso (Treino): " + error.message);
              })
          );
        }

        if (isMeal) {
          aiPromises.push(
            supabase.functions.invoke('ybytu-generate-meal-plan')
              .then(({ error }) => {
                if (error) throw new Error("Aviso (Nutrição): " + error.message);
              })
          );
        }

        if (aiPromises.length > 0) {
          await Promise.all(aiPromises)
            .then(() => {
               // SÓ MOSTRA SUCESSO SE AS DUAS IAS ACABAREM BEM!
               alert(`🏆 Fantástico, ${userName}! O seu perfil foi configurado com sucesso e os planos estão prontos!`);
               if (onComplete) onComplete(); 
            })
            .catch((aiError) => {
               // SE UMA FALHAR, AVISA, MAS DEIXA PASSAR!
               console.error("Erro numa das IAs:", aiError);
               alert("O seu perfil foi salvo, mas a IA demorou muito a responder. Os planos aparecerão em breve.");
               if (onComplete) onComplete(); 
            });
        } else {
           // Se não comprou plano nenhum (fallback)
           alert(`🏆 Fantástico, ${userName}! Perfil configurado.`);
           if (onComplete) onComplete(); 
        }

      } catch (e) {
        // ISTO AQUI SÓ PEGA ERROS DO SUPABASE (ex: Falha ao guardar na tabela profiles)
        alert(e.message || "Ocorreu um erro inesperado ao salvar o perfil.");
        console.error("Erro de Base de Dados:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <View className="flex-1 bg-bgBody justify-center"><ActivityIndicator size="large" color="#F55F16" /></View>;

  const currentData = visibleSteps[currentStep];

  return (
    <SafeAreaView className="flex-1 bg-bgBody justify-center items-center">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 w-full max-w-2xl bg-bgBody shadow-sm sm:border-x sm:border-borderColor">
        
        <View className="px-6 pt-8 pb-4">
          <View className="h-1.5 w-full bg-surface rounded-full overflow-hidden mb-6">
            <View className="h-full bg-brand" style={{ width: `${((currentStep + 1) / visibleSteps.length) * 100}%` }} />
          </View>
          <Text className="text-xs font-bold text-textMuted uppercase tracking-widest">
            Passo {currentStep + 1}/{visibleSteps.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text className="text-3xl font-black text-textMain mb-2">{currentData.title}</Text>
          <Text className="text-textMuted mb-8">{currentData.subtitle}</Text>

          {currentData.type === 'number' || currentData.type === 'text' ? (
            <TextInput 
              value={String(answers[currentData.dbField] || '')} 
              onChangeText={(t) => setAnswers({...answers, [currentData.dbField]: t})} 
              keyboardType={currentData.type === 'number' ? "numeric" : "default"} 
              placeholder={currentData.placeholder} 
              placeholderTextColor="#666" 
              multiline={currentData.type === 'text'}
              className="bg-surface text-textMain p-5 rounded-2xl text-xl border border-borderColor min-h-[60px]" 
            />
          ) : currentData.type === 'slider' ? (
            <View className="bg-surface p-8 rounded-3xl border border-borderColor items-center shadow-sm">
              <Text className="text-brand text-6xl font-black mb-1">
                {answers[currentData.dbField] || currentData.recommended}
                <Text className="text-2xl text-textMuted font-bold"> min</Text>
              </Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={currentData.min} maximumValue={currentData.max} step={currentData.step}
                value={answers[currentData.dbField] || currentData.recommended}
                onValueChange={(val) => setAnswers({...answers, [currentData.dbField]: val})}
                minimumTrackTintColor="#F55F16" maximumTrackTintColor="#333333" thumbTintColor="#F55F16"        
              />
            </View>
          ) : (
            <View className="gap-3">
              {currentData.options?.map((opt, i) => {
                const isSelected = currentData.type === 'multiple' 
                  ? (answers[currentData.dbField] || []).includes(opt.id) 
                  : answers[currentData.dbField] === opt.id;
                return (
                  <TouchableOpacity key={i} onPress={() => handleSelect(opt.id)} className={`p-5 rounded-2xl flex-row justify-between items-center border ${isSelected ? 'border-brand bg-brand/10' : 'border-borderColor bg-surface'}`}>
                    <Text className={`text-lg font-medium ${isSelected ? 'text-brand' : 'text-textMain'}`}>
                      {opt.name_ptbr || opt.name}
                    </Text>
                    <View className={`w-6 h-6 border justify-center items-center ${currentData.type === 'multiple' ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'border-brand bg-brand' : 'border-gray-500'}`}>
                      {isSelected && <View className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View className="p-6 flex-row gap-4 border-t border-borderColor">
          <TouchableOpacity onPress={() => setCurrentStep(Math.max(0, currentStep - 1))} className="flex-1 p-4 bg-surface rounded-xl items-center">
            <Text className="text-textMuted font-bold">VOLTAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextStep} className="flex-[2] p-4 bg-brand rounded-xl items-center">
            <Text className="text-white font-black text-lg">{currentStep === visibleSteps.length - 1 ? 'FINALIZAR' : 'PRÓXIMO'}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}