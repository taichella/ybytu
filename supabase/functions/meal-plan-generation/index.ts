import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =========================================================
// AI FUNCTION (FORCING FAST AND FREE MODEL - FLASH)
// =========================================================
async function callGemini(prompt: string, apiKey: string, retries = 3) {
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const listRes = await fetch(listUrl);
  const listData = await listRes.json();
  
  const availableModels = listData.models?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent')) || [];
  
  let bestModel = availableModels.find((m: any) => m.name.includes('flash'));
  if (!bestModel) {
      bestModel = availableModels.find((m: any) => m.name === 'models/gemini-1.5-pro' || m.name === 'models/gemini-pro');
  }
  
  if (!bestModel) throw new Error("No compatible Gemini model found.");
  
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
      console.warn(`[GOOGLE RATE LIMIT] Attempt ${attempt} failed. Reason: ${data.error.message}`);
      if (attempt === retries) throw new Error(`AI servers overloaded. Details: ${data.error.message}`);
      
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
    
    if (profile.subscription_type_id !== SUBSCRIPTION_PLANS.MEAL && profile.subscription_type_id !== SUBSCRIPTION_PLANS.COMPLETE) {
        return new Response(JSON.stringify({ success: false, access_denied: true, message: "Subscription does not include meal plans." }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

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

    // DATA EXTRACTION (NUTRITION CONTEXT)
    const gender = await fetchName('genders', profile.gender_id) || "Not specified";
    const userAge = profile.age || "Not specified";
    const userWeight = profile.weight_kg || "Not specified";
    const userHeight = profile.height_cm || "Not specified";
    const userGoals = await fetchNamesArray('goals', profile.goals_ids) || "Not specified";
    const healthConditions = await fetchNamesArray('health_conditions', profile.health_conditions_ids) || "None";
    
    let dietaryPreference = "Standard";
    if (profile.dietary_preference_id) {
       dietaryPreference = await fetchName('dietary_preferences', profile.dietary_preference_id) || "Standard";
    }
    
    const dietaryRestrictions = await fetchNamesArray('dietary_restrictions', profile.dietary_restrictions_ids) || "None";
    const dislikedFoods = profile.disliked_foods || "None";
    const nutritionDays = profile.nutrition_days_per_week || "Adaptable";
    const mealsPerDay = profile.meals_per_day || "Adaptable";
    const pregnancyInfo = profile.pregnancy_trimester ? `PREGNANT (${profile.pregnancy_trimester}º trimester)` : 'No';

    // HOLISTIC EXTRACTION (TRAINING CONTEXT IF COMPLETE PLAN)
    let holisticContext = "";
    if (isCompletePlan) {
       const idDoNivel = profile.exercise_level_id || profile.level_id || null;
       const exerciseLevel = await fetchName('exercise_levels', idDoNivel) || "Not specified";
       
       const idDoAmbiente = profile.exercise_environment_id || profile.environment_id || null;
       const exerciseEnvironment = await fetchName('exercise_environment', idDoAmbiente) || "Not specified";
       
       holisticContext = `
       === HOLISTIC TRAINING CONTEXT (COMPLETE PLAN ACTIVE) ===
       The user is also receiving a workout plan. Adjust macros and caloric intake considering:
       - Training Level: ${exerciseLevel}
       - Environment: ${exerciseEnvironment}
       - Training Days: ${profile.training_days_per_week || "Not specified"} days/week
       - Duration: ${profile.training_duration_minutes || "Not specified"} min/session`;
    }

    // BIOMETRICS
    let bmiValue = "N/A";
    let bmiClassification = "N/A";
    if (profile.weight_kg && profile.height_cm) {
      const heightMeters = profile.height_cm / 100;
      const bmi = profile.weight_kg / (heightMeters * heightMeters);
      bmiValue = bmi.toFixed(1);
      bmiClassification = bmi < 18.5 ? "Underweight" : bmi < 24.9 ? "Normal weight" : bmi < 29.9 ? "Overweight" : "Obese";
    }

    // FETCH MEAL CATALOG
    const { data: dbMealPlans, error: mealsError } = await supabaseClient.from('meal_plans').select('*'); 
    if (mealsError || !dbMealPlans || dbMealPlans.length === 0) throw new Error("Failed to load meal catalog.");

    const mealCatalog = dbMealPlans.map((p, index) => {
        return `[OPTION_ID: ${index}] -> NAME: "${p.name_ptbr}" | DB_RAW_DATA: ${JSON.stringify(p)}`;
    }).join('\n');

    // AI PROMPT
    const selectionPrompt = `You are a Clinical Nutrition Matchmaking Algorithm. Cross-reference the User Profile with the Meal Plan Catalog.

    === USER NUTRITIONAL DOSSIER ===
    - BIOMETRICS: ${gender}, ${userAge} years, ${userWeight}kg, ${userHeight}cm | BMI: ${bmiValue} (${bmiClassification})
    - GOALS: ${userGoals}
    - DIETARY PREFERENCE (CRITICAL): ${dietaryPreference}
    - RESTRICTIONS & INTOLERANCES (CRITICAL): ${dietaryRestrictions}
    - DISLIKED FOODS: ${dislikedFoods}
    - AVAILABILITY: ${nutritionDays} days/week | ${mealsPerDay} meals/day
    - HEALTH CONDITIONS & PREGNANCY (CRITICAL): ${healthConditions} | Pregnant: ${pregnancyInfo}
    ${holisticContext}

    === MEAL PLAN CATALOG ===
    ${mealCatalog}

    === ELIMINATION AND EVALUATION MATRIX (HARD CONSTRAINTS) ===
    1. PREFERENCE RULE (HARD CONSTRAINT): If user preference is "${dietaryPreference}", strictly ELIMINATE plans that violate it (e.g., do not suggest a standard meat plan to a Vegan).
    2. CALORIC NEED RULE (PRIORITY): Look for the plan whose calories described in DB_RAW_DATA closest match the estimated metabolic needs for the user's goals (${userGoals}) and biometrics.
    3. MEALS RULE (PRIORITY): Prioritize plans that match closely with ${mealsPerDay} meals per day.
    4. CLINICAL RULE (HARD CONSTRAINT): Strictly adapt the choices for pregnant users or reported health conditions.
    5. LANGUAGE RULE (CRITICAL): The 'justification' MUST be written entirely in Brazilian Portuguese (PT-BR).

    Return ONLY a valid JSON:
    {"option_number": X, "justification": "Write the clinical and technical justification OBRIGATORIAMENTE EM PORTUGUÊS DO BRASIL (PT-BR) here."}`;
          
    const aiResponse = await callGemini(selectionPrompt, geminiKey);
    const chosenIndex = parseInt(aiResponse.option_number);
    const decisionJustification = aiResponse.justification;

    if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= dbMealPlans.length) throw new Error("AI failed elimination matrix.");
    const chosenPlan = dbMealPlans[chosenIndex];

    // INSERT DB VINK
    const { error: insertError } = await supabaseClient.from('user_meal_plans').insert({
        user_id: userId,
        meal_plan_id: chosenPlan.id
    });
    if (insertError) throw new Error("DB Insert Error: " + insertError.message);

    // FINAL RESPONSE
    return new Response(JSON.stringify({ 
      success: true, 
      meal_plan: {
         meal_plan_id: chosenPlan.id, 
         name: chosenPlan.name_ptbr
      },
      ai_ybytu: { 
         decision: decisionJustification,
         metabolic_analysis: {
             bmi: bmiValue,
             bmi_classification: bmiClassification
         }
      },
      message: "Exhaustive meal matchmaking completed."
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
})