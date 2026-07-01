import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =========================================================
// FUNÇÃO DA IA (FORÇANDO O MODELO GRATUITO E RÁPIDO - FLASH)
// =========================================================
async function callGemini(prompt: string, apiKey: string, retries = 3) {
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const listRes = await fetch(listUrl);
  const listData = await listRes.json();
  
  const availableModels = listData.models?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent')) || [];
  
  // 1. Prioridade MÁXIMA: Pegar o modelo 'Flash' (que é grátis, rápido e aguenta textos gigantes)
  let bestModel = availableModels.find((m: any) => m.name.includes('flash'));
  
  // 2. Fallback de segurança estrito (NUNCA pegar o 3.1 premium)
  if (!bestModel) {
      bestModel = availableModels.find((m: any) => m.name === 'models/gemini-1.5-pro' || m.name === 'models/gemini-pro');
  }
  
  if (!bestModel) throw new Error("Nenhum modelo Gemini gratuito e compatível encontrado na sua chave.");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/${bestModel.name}:generateContent?key=${apiKey}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 } 
      })
    });
    
    const data = await response.json();
    
    if (data.error && (data.error.code === 503 || data.error.code === 429)) {
      console.warn(`[GOOGLE RATE LIMIT] Tentativa ${attempt} falhou. Motivo: ${data.error.message}`);
      
      if (attempt === retries) throw new Error(`AI servers overloaded. Detalhe: ${data.error.message}`);
      
      // Espera Exponencial de segurança
      const waitTime = attempt * 4000; 
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue; 
    }
    
    if (data.error) throw new Error("AI Error: " + JSON.stringify(data.error));
    
    return JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim());
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY; 
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

    if (!supabaseKey || !geminiKey) throw new Error("Missing API Keys.");

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const { userId } = await req.json();

    const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
    if (profileError || !profile) throw new Error("Profile not found.");

    // SUBSCRIPTION CHECK
    const SUBSCRIPTION_PLANS = {
      TRAINING: '3a5ccc00-77ed-4b87-8e83-bc35be63a862',
      MEAL: '7458939c-ed4b-4a16-960e-b647f94e6a9b',
      COMPLETE: '7b5502f1-eeed-4640-8c4f-0ebc0502481e',
    };
    const isCompletePlan = profile.subscription_type_id === SUBSCRIPTION_PLANS.COMPLETE;

    // HELPER FUNCTIONS
    const fetchName = async (table: string, id: string) => {
        if (!id) return null;
        const { data } = await supabaseClient.from(table).select('*').eq('id', id).maybeSingle();
        if (!data) return null;
        return data.name_ptbr || data.label_ptbr || data.label_pt || data.name || null;
    };

    const fetchNamesArray = async (table: string, ids: string[]) => {
        if (!ids || ids.length === 0) return null;
        const { data } = await supabaseClient.from(table).select('*').in('id', ids);
        if (!data || data.length === 0) return null;
        return data.map(d => d.name_ptbr || d.label_ptbr || d.label_pt || d.name).filter(Boolean).join(", ");
    };

    // DATA EXTRACTION (TRAINING CONTEXT)
    const gender = await fetchName('genders', profile.gender_id) || "Não especificado";
    const userAge = profile.age || "Não especificada";
    const userWeight = profile.weight_kg || "Não especificado";
    const userHeight = profile.height_cm || "Não especificada";
    
    const exerciseLevel = await fetchName('exercise_levels', profile.exercise_level_id) || "Não informado";
    const exerciseEnvironment = await fetchName('exercise_environment', profile.exercise_environment_id) || "Não informado";
    
    const userGoals = await fetchNamesArray('goals', profile.goals_ids) || "Não informado";
    const healthConditions = await fetchNamesArray('health_conditions', profile.health_conditions_ids) || "Nenhuma";
    const trainingDays = profile.training_days_per_week || "Adaptável";
    const trainingDuration = profile.training_duration_minutes || "Adaptável";
    const pregnancyInfo = profile.pregnancy_trimester ? `GESTANTE (${profile.pregnancy_trimester}º trimestre)` : 'Não';

    // LENDO EQUIPAMENTOS
    let exerciseEquipments = "Não informado";
    if (profile.exercise_equipments_ids && profile.exercise_equipments_ids.length > 0) {
       const { data: onboardingEq } = await supabaseClient
          .from('onboarding_exercise_equipments')
          .select('main_exercise_equipment_id')
          .in('id', profile.exercise_equipments_ids);
       const mainEqIds = onboardingEq?.map(row => row.main_exercise_equipment_id).filter(id => id) || [];
       if (mainEqIds.length > 0) {
          const { data: mainEqData } = await supabaseClient
             .from('exercise_equipments')
             .select('*')
             .in('id', [...new Set(mainEqIds)]);
          if (mainEqData && mainEqData.length > 0) {
             exerciseEquipments = mainEqData.map(e => e.name_ptbr || e.label_ptbr || e.label_pt || e.name).filter(Boolean).join(", ");
          }
       }
    }

    // SMART OVERRIDE AMBIENTE ACADEMIA
    if (exerciseEnvironment && exerciseEnvironment.toLowerCase().includes('academia')) {
        exerciseEquipments = "Equipamentos completos de Academia (Máquinas, Halteres, Barras, Polias, etc)";
    }

    // LENDO DORES
    let physicalConditions = "Nenhuma restrição";
    if (profile.physical_conditions_ids && profile.physical_conditions_ids.length > 0) {
       const { data: onboardingPain } = await supabaseClient
          .from('onboarding_physical_conditions')
          .select('main_physical_conditions_ids')
          .in('id', profile.physical_conditions_ids);
       const mainPainIds = onboardingPain?.map(row => row.main_physical_conditions_ids).filter(id => id) || [];
       if (mainPainIds.length > 0) {
          const { data: mainPainData } = await supabaseClient
             .from('physical_conditions')
             .select('*')
             .in('id', [...new Set(mainPainIds)]);
          if (mainPainData && mainPainData.length > 0) {
             physicalConditions = mainPainData.map(p => p.name_ptbr || p.label_ptbr || p.label_pt || p.name).filter(Boolean).join(", ");
          }
       }
    }

    // LENDO MÚSCULOS
    let targetMuscleGroups = "Corpo inteiro";
    if (profile.muscle_groups_ids && profile.muscle_groups_ids.length > 0) {
       const { data: muscleData } = await supabaseClient
          .from('onboarding_muscle_groups')
          .select('*')
          .in('id', profile.muscle_groups_ids);
       if (muscleData && muscleData.length > 0) {
          targetMuscleGroups = muscleData.map(m => m.name_ptbr || m.label_ptbr || m.label_pt || m.name).filter(Boolean).join(", ");
       }
    }

    // HOLISTIC EXTRACTION
    let holisticContext = "";
    if (isCompletePlan) {
       let dietPref = "Standard";
       if (profile.dietary_preference_id) {
         const { data } = await supabaseClient.from('dietary_preferences').select('*').eq('id', profile.dietary_preference_id).maybeSingle();
         if (data) dietPref = data.name_ptbr || data.label_ptbr || data.label_pt || data.name;
       }
       const dietRestr = await fetchNamesArray('dietary_restrictions', profile.dietary_restrictions_ids) || "Nenhuma";
       holisticContext = `
       === HOLISTIC NUTRITION CONTEXT (COMPLETE PLAN ACTIVE) ===
       The user is also receiving a diet plan. Adjust workout intensity considering:
       - Dietary Preference: ${dietPref}
       - Restrictions: ${dietRestr}
       - Meals per day: ${profile.meals_per_day || "Not specified"}`;
    }

    // BIOMETRICS
    let bmiValue = "N/A";
    let bmiClassification = "N/A";
    if (profile.weight_kg && profile.height_cm) {
      const heightMeters = profile.height_cm / 100;
      const bmi = profile.weight_kg / (heightMeters * heightMeters);
      bmiValue = bmi.toFixed(1);
      bmiClassification = bmi < 18.5 ? "Abaixo do peso" : bmi < 24.9 ? "Peso normal" : bmi < 29.9 ? "Sobrepeso" : "Obesidade";
    }

    // FETCH TRAINING CATALOG (TUDO, SEM LIMITES!)
    const { data: dbPlans, error: plansError } = await supabaseClient.from('training_plans').select('*'); 
    if (plansError || !dbPlans || dbPlans.length === 0) throw new Error("Failed to load training catalog.");

    const trainingCatalog = dbPlans.map((p, index) => {
      return `[OPTION_ID: ${index}] -> NAME: "${p.name_ptbr}" | DB_RAW_DATA: ${JSON.stringify(p)}`;
    }).join('\n');

    // AI PROMPT
    const selectionPrompt = `You are a High-Precision Sports Matchmaking Algorithm. Cross-reference the User Profile with the Training Catalog.

    === USER PROFILE ===
    - BIOMETRICS: ${gender}, ${userAge} years, ${userWeight}kg, ${userHeight}cm | BMI: ${bmiValue} (${bmiClassification})
    - EXPERIENCE LEVEL (CRITICAL): ${exerciseLevel}
    - TRAINING ENVIRONMENT (CRITICAL): ${exerciseEnvironment}
    - AVAILABLE EQUIPMENT: ${exerciseEquipments}
    - AVAILABILITY (CRITICAL): ${trainingDays} days/week | ${trainingDuration} min/session
    - GOALS: ${userGoals}
    - MUSCLE FOCUS: ${targetMuscleGroups}
    - PHYSICAL LIMITATIONS/PAIN (CRITICAL): ${physicalConditions}
    - HEALTH CONDITIONS & PREGNANCY (CRITICAL): ${healthConditions} | Pregnant: ${pregnancyInfo}
    ${holisticContext}

    === TRAINING CATALOG ===
    ${trainingCatalog}

    === MATRIZ DE AVALIAÇÃO (REGRAS CLÍNICAS E DESPORTIVAS) ===
    1. ENVIRONMENT RULE (HARD CONSTRAINT): If the user environment is "${exerciseEnvironment}", ELIMINATE plans designed for incompatible environments. Check the plan name and DB_RAW_DATA.
    2. LEVEL RULE (PRIORITY): The user experience level is "${exerciseLevel}". PRIORITIZE plans that match this level. It is completely acceptable to assign a simpler/easier plan to an advanced user if it fits their specific clinical or routine needs. However, NEVER assign a highly advanced or complex plan to a pure beginner.
    3. ROUTINE RULE (PRIORITY): Match the plan with ${trainingDays} days/week and ${trainingDuration} minutes.
    4. EQUIPMENT RULE (HARD CONSTRAINT): Ensure the plan matches available equipment (${exerciseEquipments}).
    5. CLINICAL RULE (HARD CONSTRAINT): Adapt strictly for pregnancy or severe pain.
    6. LANGUAGE RULE (CRITICAL): The 'justification' MUST be written entirely in Brazilian Portuguese (PT-BR).

    Return ONLY a valid JSON:
    {"option_number": X, "justification": "Escreva a justificativa clínica e técnica OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL (PT-BR) aqui."}`;
    
    const aiResponse = await callGemini(selectionPrompt, geminiKey);
    const chosenIndex = parseInt(aiResponse.option_number);
    const decisionJustification = aiResponse.justification;

    if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= dbPlans.length) throw new Error("AI failed evaluation matrix.");
    const chosenPlan = dbPlans[chosenIndex]; 

    // INSERT DB VINK
    const { error: insertError } = await supabaseClient.from('user_training_plans').insert({
        user_id: userId,
        training_plan_id: chosenPlan.id
    });
    if (insertError) throw new Error("DB Insert Error: " + insertError.message);

    // FINAL RESPONSE
    return new Response(JSON.stringify({ 
      success: true, 
      training_plan: {
         training_plan_id: chosenPlan.id, 
         name: chosenPlan.name_ptbr, 
         id: chosenPlan.id 
      },
      ai_ybytu: {
         decision: decisionJustification,
         metabolic_analysis: {
             bmi: bmiValue,
             bmi_classification: bmiClassification
         }
      },
      message: "Exhaustive training matchmaking completed."
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
})