import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    );

    const { count = 10 } = await req.json();
    console.log(`Iniciando geração em lote de ${count} planos de treino...`);

    const { data: exercises, error: exError } = await supabaseClient.from('exercises').select('id, exercise_equipments_ids, exercise_level_id');
    if (exError || !exercises || exercises.length === 0) throw new Error("Erro ao buscar exercícios: " + exError?.message);

    const goalsMap: Record<string, string> = {
      'weight_loss': 'Emagrecimento',
      'hypertrophy': 'Ganho de Massa',
      'conditioning': 'Condicionamento Físico',
      'health_routine': 'Rotina Saudável'
    };
    const levels = ['beginner', 'intermediate', 'advanced'];
    const environments = ['home', 'gym'];
    const daysOpts = [3, 4, 5, 6];

    const plansToInsert = [];
    const planExercisesToInsert = [];

    for (let i = 0; i < count; i++) {
      const goalKey = getRandom(Object.keys(goalsMap));
      const level = getRandom(levels);
      const env = getRandom(environments);
      const days = getRandom(daysOpts);
      
      const baseDuration = level === 'beginner' ? 30 : (level === 'intermediate' ? 45 : 60);
      const duration = baseDuration + getRandom([-5, 0, 5, 10]);
      
      const planUuid = crypto.randomUUID();
      
      const namePt = `Plano ${goalsMap[goalKey]} - ${env === 'home' ? 'Em Casa' : 'Academia'} - Nível ${level.charAt(0).toUpperCase() + level.slice(1,3)} - ${days}x`;
      const nameEn = `${goalKey.charAt(0).toUpperCase() + goalKey.slice(1)} Plan - ${env} - ${level} - ${days}x`;
      const nameFr = `Plan ${goalKey} - ${env} - ${level} - ${days}x`;
      
      const equipments = env === 'home' ? ["none_bodyweight"] : ["dumbbells", "machines"];

      plansToInsert.push({
        id: planUuid,
        training_plan_id: planUuid, 
        name_ptbr: namePt,
        name_en: nameEn,
        name_fr: nameFr,
        goals_ids: [goalKey],
        exercise_environments_ids: [env],
        exercise_equipment_ids: equipments,
        level_id: level,
        days_per_week: days,
        duration_min: duration,
        instruction_pt: "Aquecimento: 5 min de mobilidade. Foque na cadência e respiração. Respeite os descansos recomendados.",
        instruction_en: "Warm-up: 5 min mobility. Focus on tempo and breathing.",
        instruction_fr: "Échauffement: 5 min de mobilité. Concentrez-vous sur le rythme.",
        created_by_ai: true
      });

      const numEx = Math.floor(Math.random() * 3) + 5;
      const shuffledEx = [...exercises].sort(() => 0.5 - Math.random());
      const chosenEx = shuffledEx.slice(0, numEx);

      let order = 1;
      for (const ex of chosenEx) {
        planExercisesToInsert.push({
          exercise_training_id: planUuid, 
          exercise_id: ex.id,
          exercise_order: order++,
          sets: parseInt(getRandom(["3", "4"])),
          reps: parseInt(getRandom(["10", "12", "15"])),
          rep_type_id: "reps",
          rest_seconds: parseInt(getRandom(["45", "60", "90"])),
          cadence_eccentric: 2,
          cadence_isometric_bottom: 0,
          cadence_concentric: 2,
          cadence_isometric_top: 0
        });
      }
    }

    // INSERÇÃO
    console.log("Salvando Planos de Treino...");
    const { error: insertPlanError } = await supabaseClient.from('training_plans').insert(plansToInsert);
    if (insertPlanError) throw new Error("Erro ao salvar planos: " + insertPlanError.message);

    console.log("Salvando Exercícios dos Planos...");
    // AQUI ESTÁ A CORREÇÃO: exercise_trainings (sem S)
    const { error: insertRelError } = await supabaseClient.from('exercise_trainings').insert(planExercisesToInsert);
    if (insertRelError) throw new Error("Erro ao salvar relação de exercícios: " + insertRelError.message);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${count} planos de treino gerados com sucesso para revisão profissional.`,
      generated_count: count
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

  } catch (error: any) {
    console.error("ERRO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
})