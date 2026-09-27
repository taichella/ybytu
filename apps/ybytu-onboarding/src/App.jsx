/**
 * ============================================================================
 * Ybytu Onboarding — Aplicação Standalone Oficial
 * Subdomínio oficial: onboarding.ybytu.app
 *
 * REGRA DE CONGELAMENTO ATIVO:
 * Enquanto durar a migração, o arquivo legado apps/OnboardingPreLaunch.html
 * NÃO muda. Se houver qualquer correção urgente necessária no widget do
 * WordPress durante este período, o usuário avisará e a alteração será
 * replicada diretamente aqui nesta versão nova.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase.js';
import {
  ALL_COUNTRIES,
  AsYouType,
  parsePhoneNumberFromString,
  getPhoneValidation,
  getCountryPlaceholder,
  maskPhone,
} from './lib/phone.js';

const SUBSCRIPTION_PLANS = {
  TRAINING: '3a5ccc00-77ed-4b87-8e83-bc35be63a862',
  MEAL: '7458939c-ed4b-4a16-960e-b647f94e6a9b',
  COMPLETE: '7b5502f1-eeed-4640-8c4f-0ebc0502481e',
};

const WHATSAPP_NUMBER = '5511955026812';

// Restrições que ficam redundantes/implícitas dado o dietary_preference_id
const DIETARY_RESTRICTION_BLOCKS_BY_PREFERENCE = {
  vegan: ['sem carne suína', 'sem carne vermelha', 'sem frutos do mar', 'sem peixe', 'sem ovos', 'sem laticínios'],
  vegetarian: ['sem carne suína', 'sem carne vermelha', 'sem frutos do mar', 'sem peixe'],
  pescetarian: ['sem carne suína', 'sem carne vermelha'],
  no_seafood: ['sem frutos do mar'],
  no_red_meat: ['sem carne vermelha'],
  no_pork: ['sem carne suína'],
  omnivore: [],
  flexitarian: [],
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(null);

  // Valores padrão dos sliders pré-definidos para garantir persistência mesmo se o aluno não arrastar
  const [answers, setAnswers] = useState({
    subscription_type_id: SUBSCRIPTION_PLANS.COMPLETE,
    training_duration_minutes: 45,
    dedicated_days_per_week: 4,
  });

  // Seletor de país / DDI
  const [whatsappCountry, setWhatsappCountry] = useState('BR');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Trava de duplo clique para submissão
  const submittingRef = useRef(false);

  // Fecha modal de países com a tecla Escape
  useEffect(() => {
    if (!countryPickerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCountryPickerOpen(false);
        setCountrySearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [countryPickerOpen]);

  // Lista de países filtrada por busca (resiliente a acentos)
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    const q = countrySearch.trim().toLowerCase();
    const queryClean = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return ALL_COUNTRIES.filter((c) => {
      const nameClean = (c.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nameClean.includes(queryClean) || c.dial.includes(q) || (c.iso && c.iso.toLowerCase().includes(q));
    });
  }, [countrySearch]);

  // Formatação de telefone em tempo real (AsYouType)
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    if (raw.trim().startsWith('+')) {
      const parsed = parsePhoneNumberFromString(raw.trim());
      if (parsed && parsed.country) {
        if (parsed.country !== whatsappCountry) {
          setWhatsappCountry(parsed.country);
        }
        try {
          const ayt = new AsYouType(parsed.country);
          const formatted = ayt.input(parsed.nationalNumber || '');
          setAnswers((prev) => ({ ...prev, whatsapp_phone: formatted }));
          return;
        } catch (err) {}
      }
      setAnswers((prev) => ({ ...prev, whatsapp_phone: raw }));
      return;
    }

    try {
      const ayt = new AsYouType(whatsappCountry);
      const formatted = ayt.input(raw);
      setAnswers((prev) => ({ ...prev, whatsapp_phone: formatted }));
    } catch (err) {
      setAnswers((prev) => ({ ...prev, whatsapp_phone: raw }));
    }
  };

  const userName = answers.first_name;

  const checkCondition = (currentAnswers, stepsData, field, matchTerm) => {
    const step = stepsData.find((s) => s.dbField === field);
    if (!step || !step.options) return false;

    const target = step.options.find(
      (o) =>
        String(o.name_ptbr || o.name || '').toLowerCase().includes(matchTerm.toLowerCase()) ||
        String(o.id).toLowerCase() === matchTerm.toLowerCase()
    );
    if (!target) return false;

    const selection = currentAnswers[field];
    if (!selection) return false;

    return Array.isArray(selection) ? selection.includes(target.id) : selection === target.id;
  };

  const [steps, setSteps] = useState([
    // ==========================================================
    // CADASTRO INICIAL
    // ==========================================================
    {
      id: 'registration',
      title: 'Vamos começar!',
      subtitle: 'Preencha seus dados para criarmos o seu perfil',
      type: 'form',
      fields: [
        { id: 'first_name', placeholder: 'Nome', type: 'text', autoComplete: 'given-name' },
        { id: 'last_name', placeholder: 'Sobrenome', type: 'text', autoComplete: 'family-name' },
        { id: 'email', placeholder: 'E-mail', type: 'email', autoComplete: 'email' },
        { id: 'whatsapp_phone', placeholder: 'WhatsApp (Ex: +351...)', type: 'tel', autoComplete: 'tel' },
      ],
      condition: () => true,
    },
    {
      id: 'goals',
      title: 'Qual é o seu principal objetivo?',
      subtitle: 'Múltipla escolha',
      type: 'multiple',
      dbField: 'goals_ids',
      table: 'goals',
      condition: () => true,
    },
    {
      id: 'gender',
      title: 'Qual o seu género?',
      subtitle: 'Escolha única',
      type: 'single',
      dbField: 'gender_id',
      table: 'genders',
      condition: () => true,
    },
    {
      id: 'age',
      title: 'Qual a sua idade?',
      subtitle: 'Digite a sua idade',
      type: 'number',
      dbField: 'age',
      placeholder: 'Ex: 38',
      condition: () => true,
    },
    {
      id: 'weight',
      title: 'Qual o seu peso atual?',
      subtitle: 'Peso em kg',
      type: 'number',
      dbField: 'weight_kg',
      placeholder: 'Ex: 70',
      condition: () => true,
    },
    {
      id: 'height',
      title: 'Qual a sua altura?',
      subtitle: 'Altura em cm',
      type: 'number',
      dbField: 'height_cm',
      placeholder: 'Ex: 155',
      condition: () => true,
    },
    {
      id: 'activity_level',
      title: 'Considera-se uma pessoa ativa?',
      subtitle: 'Escolha única',
      type: 'single',
      dbField: 'activity_level_id',
      table: 'activity_levels',
      condition: () => true,
    },
    {
      id: 'health_conditions',
      title: 'Possui alguma condição de saúde?',
      subtitle: 'Múltipla escolha',
      type: 'multiple',
      dbField: 'health_conditions_ids',
      table: 'health_conditions',
      condition: () => true,
    },
    {
      id: 'pregnancy_trimester',
      title: 'Em qual trimestre da gestação está?',
      subtitle: 'Escolha única',
      type: 'single',
      dbField: 'pregnancy_trimester',
      options: [
        { id: 1, name_ptbr: '1º trimestre' },
        { id: 2, name_ptbr: '2º trimestre' },
        { id: 3, name_ptbr: '3º trimestre' },
      ],
      condition: (ans, stp) => checkCondition(ans, stp, 'health_conditions_ids', 'Gravidez'),
    },
    // ==========================================================
    // ETAPAS UNIFICADAS & TREINO
    // ==========================================================
    {
      id: 'physical_conditions',
      title: 'Possui alguma dor ou limitação física?',
      subtitle: 'Múltipla escolha',
      type: 'multiple',
      dbField: 'physical_conditions_ids',
      table: 'onboarding_physical_conditions',
      condition: () => true,
    },
    {
      id: 'dedicated_days_per_week',
      title: 'Quantos dias por semana pretende se dedicar ao plano?',
      subtitle:
        'Menos de 3 dias não dá estímulo suficiente pra resultado; mais de 5 não deixa o músculo recuperar entre os treinos.',
      type: 'slider',
      dbField: 'dedicated_days_per_week',
      min: 3,
      max: 5,
      step: 1,
      recommended: 4,
      unit: 'dias',
      condition: () => true,
    },
    {
      id: 'muscle_groups',
      title: 'Qual parte do corpo gostaria de focar?',
      subtitle: 'Múltipla escolha',
      type: 'multiple',
      dbField: 'muscle_groups_ids',
      table: 'onboarding_muscle_groups',
      condition: () => true,
    },
    {
      id: 'exercise_environment',
      title: 'Onde pretende treinar?',
      subtitle: 'Escolha única',
      type: 'single',
      dbField: 'exercise_environment_id',
      table: 'exercise_environment',
      condition: () => true,
    },
    {
      id: 'exercise_equipments',
      title: 'Que equipamentos possui?',
      subtitle: 'Múltipla escolha',
      type: 'multiple',
      dbField: 'exercise_equipment_ids',
      table: 'onboarding_exercise_equipments',
      condition: (answers, stepsData) => {
        const environmentAnswer = answers.exercise_environment_id;
        if (!environmentAnswer) return false;

        const environmentStep = stepsData.find((step) => step.dbField === 'exercise_environment_id');
        const chosenOption = environmentStep?.options?.find((opt) => opt.id === environmentAnswer);

        const selectedHomeWithEquipment =
          environmentAnswer === 'home_with_equipment' ||
          (chosenOption && Object.values(chosenOption).some((value) => String(value).includes('home_with_equipment')));

        return selectedHomeWithEquipment;
      },
    },
    {
      id: 'training_duration_minutes',
      title: 'Quanto tempo tem por treino?',
      subtitle: 'Deslize para definir o tempo',
      type: 'slider',
      dbField: 'training_duration_minutes',
      min: 15,
      max: 90,
      step: 15,
      recommended: 45,
      unit: 'min',
      condition: () => true,
    },
    {
      id: 'exercise_level',
      title: 'Qual a sua experiência com treinos?',
      subtitle: 'Escolha única',
      type: 'single',
      dbField: 'exercise_level_id',
      table: 'exercise_levels',
      condition: () => true,
    },
    // ==========================================================
    // ETAPAS DE NUTRIÇÃO
    // ==========================================================
    {
      id: 'meals_per_day',
      title: 'Como é sua rotina alimentar?',
      subtitle: 'É só pra entender seus hábitos — o nutricionista vai indicar o ideal para você',
      type: 'single',
      dbField: 'meals_per_day',
      options: [
        { id: 3, name_ptbr: '3 refeições principais — café da manhã, almoço e jantar' },
        { id: 4, name_ptbr: '3 refeições + 1 lanche' },
        { id: 5, name_ptbr: '3 refeições + 2 lanches' },
        { id: 6, name_ptbr: '3 refeições + 3 lanches — comendo a cada 3 horas' },
      ],
      condition: () => true,
    },
    {
      id: 'dietary_preferences',
      title: 'Qual opção define melhor sua alimentação?',
      subtitle: 'Escolha única',
      type: 'single',
      dbField: 'dietary_preference_id',
      table: 'dietary_preferences',
      condition: () => true,
    },
    {
      id: 'dietary_restrictions',
      title: 'Possui alguma restrição ou intolerância alimentar?',
      subtitle: 'Múltipla escolha',
      type: 'multiple',
      dbField: 'dietary_restrictions_ids',
      table: 'dietary_restrictions',
      condition: () => true,
    },
    {
      id: 'disliked_foods',
      title: 'Existe algum alimento que prefere evitar?',
      subtitle: 'Deixe em branco se comer de tudo',
      type: 'text',
      dbField: 'disliked_foods',
      placeholder: 'Ex: fígado, cebola, brócolis…',
      condition: () => true,
    },
  ]);

  useEffect(() => {
    async function fetchAllOptions() {
      try {
        const updatedSteps = await Promise.all(
          steps.map(async (step) => {
            if (step.table) {
              const { data, error } = await supabase.from(step.table).select('*').order('sort_order');
              if (error || !data) return step;
              let mapped = data.map((item) => ({
                ...item,
                id: item.id || item[Object.keys(item).find((k) => k.includes('id'))],
                name_ptbr: item.name_ptbr || item.label_ptbr || item.name || item.title,
                name: item.name_ptbr || item.label_ptbr || item.name || item.title,
              }));
              if (step.dbField === 'dietary_restrictions_ids') {
                const REDUNDANT_WITH_PREFERENCE = [
                  'sem carne suína',
                  'sem carne vermelha',
                  'sem frutos do mar',
                  'sem peixe',
                ];
                mapped = mapped.filter(
                  (o) => !REDUNDANT_WITH_PREFERENCE.includes(String(o.name_ptbr || '').trim().toLowerCase())
                );
              }
              return { ...step, options: mapped };
            }
            return step;
          })
        );
        setSteps(updatedSteps);
      } catch (e) {
        console.error('Erro na busca das opções:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAllOptions();
  }, []);

  const visibleSteps = useMemo(
    () => steps.filter((step) => (step.condition ? step.condition(answers, steps) : true)),
    [answers, steps]
  );

  const findNoneOption = (options) =>
    (options || []).find((o) => {
      const label = String(o.name_ptbr || o.name || '').trim().toLowerCase();
      return label === 'nenhuma' || label === 'nenhum';
    });

  const getBlockedRestrictionIds = (preferenceOptionId) => {
    if (!preferenceOptionId) return [];
    const prefOptions = steps.find((s) => s.dbField === 'dietary_preference_id')?.options || [];
    const chosenPref = prefOptions.find((o) => o.id === preferenceOptionId);
    const blockedLabels = DIETARY_RESTRICTION_BLOCKS_BY_PREFERENCE[chosenPref?.dietary_preference_id] || [];
    const restrictionOptions = steps.find((s) => s.dbField === 'dietary_restrictions_ids')?.options || [];
    return restrictionOptions
      .filter((o) => blockedLabels.includes(String(o.name_ptbr || o.name || '').trim().toLowerCase()))
      .map((o) => o.id);
  };

  const handleSelect = (optionId) => {
    const stepData = visibleSteps[currentStep];
    const field = stepData.dbField;
    if (stepData.type === 'multiple') {
      const noneOption = findNoneOption(stepData.options);
      const selections = answers[field] || [];

      let newSelections;
      if (noneOption && optionId === noneOption.id) {
        newSelections = selections.includes(optionId) ? [] : [optionId];
      } else {
        const withoutNone = noneOption ? selections.filter((i) => i !== noneOption.id) : selections;
        newSelections = withoutNone.includes(optionId)
          ? withoutNone.filter((i) => i !== optionId)
          : [...withoutNone, optionId];
      }
      setAnswers({ ...answers, [field]: newSelections });
    } else if (field === 'dietary_preference_id') {
      const blockedIds = getBlockedRestrictionIds(optionId);
      const currentRestrictions = answers.dietary_restrictions_ids || [];
      setAnswers({
        ...answers,
        [field]: optionId,
        dietary_restrictions_ids: currentRestrictions.filter((id) => !blockedIds.includes(id)),
      });
    } else {
      setAnswers({ ...answers, [field]: optionId });
    }
  };

  const isNextDisabled = () => {
    const stepData = visibleSteps[currentStep];
    if (!stepData) return true;
    const value = answers[stepData.dbField];
    if (stepData.type === 'form') {
      if (!answers.first_name || !answers.last_name || !answers.email || !answers.whatsapp_phone) return true;
      return !!getPhoneValidation(answers.whatsapp_phone, whatsappCountry).error;
    }
    if (stepData.type === 'single') {
      return value === undefined || value === null || value === '';
    }
    if (stepData.type === 'multiple') {
      return !Array.isArray(value) || value.length === 0;
    }
    if (stepData.type === 'number') {
      return value === undefined || value === null || value === '' || isNaN(Number(value));
    }
    return false;
  };

  const openTeamWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Sou o ${userName} e acabei de finalizar meu perfil na plataforma.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener');
  };

  const nextStep = async () => {
    setPhoneTouched(true);
    if (isNextDisabled()) return;

    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setLoading(true);
      try {
        const email = answers.email?.trim();
        const firstName = answers.first_name?.trim();
        const lastName = answers.last_name?.trim();
        const phoneValidation = getPhoneValidation(answers.whatsapp_phone, whatsappCountry);
        const whatsappPhone = phoneValidation.e164 || answers.whatsapp_phone?.trim();

        // 1. Criar conta — senha gerada, invisível
        const generatedPassword = crypto.randomUUID();

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: generatedPassword,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`.trim(),
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes('already registered')) {
            alert('Este e-mail já tem um perfil por aqui. Verifique seu WhatsApp ou fale com a gente.');
            return;
          }
          throw new Error('Erro ao criar conta: ' + signUpError.message);
        }

        if (signUpData?.user?.identities && signUpData.user.identities.length === 0) {
          alert('Este e-mail já tem um perfil por aqui. Verifique seu WhatsApp ou fale com a gente.');
          return;
        }

        if (!signUpData?.session) {
          console.error(
            'signUp não retornou session -- "Confirm email" pode estar ligado no Supabase Auth. Onboarding não pode prosseguir sem sessão imediata.',
            { userId: signUpData?.user?.id }
          );
          alert('Conta criada! Confirme seu e-mail para continuar.');
          return;
        }

        const withTimeout = (promise, ms) =>
          Promise.race([
            promise,
            new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), ms)),
          ]);

        // 2. Salva o perfil e dispara geração de plano atômica no servidor
        const isPregnancyVisible = steps.find((s) => s.id === 'pregnancy_trimester')?.condition(answers, steps) ?? false;
        const isEquipmentsVisible = steps.find((s) => s.id === 'exercise_equipments')?.condition(answers, steps) ?? false;
        const blockedRestrictionIdsAtSubmit = getBlockedRestrictionIds(answers.dietary_preference_id);
        const safeDietaryRestrictions = (answers.dietary_restrictions_ids || []).filter(
          (id) => !blockedRestrictionIdsAtSubmit.includes(id)
        );

        const { data: completeResult, error: completeError } = await withTimeout(
          supabase.functions.invoke('ybytu-onboarding-complete', {
            body: {
              profile: {
                identity: {
                  full_name: `${firstName} ${lastName}`.trim(),
                  first_name: firstName,
                  last_name: lastName,
                  whatsapp_phone: whatsappPhone,
                },
                onboarding: {
                  goals_ids: answers.goals_ids || [],
                  gender_id: answers.gender_id,
                  age: answers.age,
                  weight_kg: answers.weight_kg,
                  height_cm: answers.height_cm,
                  activity_level_id: answers.activity_level_id,
                  health_conditions_ids: answers.health_conditions_ids || [],
                  pregnancy_trimester: isPregnancyVisible ? answers.pregnancy_trimester : null,
                  physical_conditions_ids: answers.physical_conditions_ids || [],
                  muscle_groups_ids: answers.muscle_groups_ids || [],
                  exercise_environment_id: answers.exercise_environment_id,
                  exercise_equipments_ids: isEquipmentsVisible ? answers.exercise_equipment_ids || [] : [],
                  training_duration_minutes: answers.training_duration_minutes,
                  exercise_level_id: answers.exercise_level_id,
                  training_days_per_week: answers.dedicated_days_per_week,
                  nutrition_days_per_week: answers.dedicated_days_per_week,
                  meals_per_day: answers.meals_per_day,
                  dietary_preference_id: answers.dietary_preference_id,
                  dietary_restrictions_ids: safeDietaryRestrictions,
                  disliked_foods: answers.disliked_foods,
                },
              },
            },
          }),
          20000
        );

        if (completeResult?.timedOut) {
          console.error('ybytu-onboarding-complete não respondeu em 20s -- seguindo mesmo assim, geração continua no servidor.');
        } else if (completeError) {
          throw new Error('Erro ao salvar perfil/gerar plano: ' + completeError.message);
        } else if (completeResult?.data?.error) {
          throw new Error('Erro ao salvar perfil/gerar plano: ' + completeResult.data.error);
        }

        // 3. Avisa usuário e sales (fire-and-forget)
        supabase.functions.invoke('ybytu-notify-onboarding-received').catch((e) => console.error(e));

        // 4. Email de confirmação (Resend) — verificação estrita de corpo { ok: true }
        let emailSent = false;
        try {
          const emailResult = await withTimeout(supabase.functions.invoke('ybytu-send-onboarding-email'), 5000);
          emailSent = emailResult?.data?.ok === true;
          if (emailResult?.timedOut) console.error('ybytu-send-onboarding-email não respondeu em 5s (timeout)');
          else if (emailResult?.error) console.error('ybytu-send-onboarding-email retornou erro:', emailResult.error);
          else if (!emailSent)
            console.error('ybytu-send-onboarding-email respondeu sem ok:true:', emailResult?.data);
        } catch (e) {
          console.error('ybytu-send-onboarding-email falhou:', e);
        }

        // 5. Gera o link compartilhável (fail-soft)
        const shareTokenResult = await withTimeout(supabase.functions.invoke('ybytu-create-plan-share-token'), 5000);
        if (shareTokenResult?.timedOut) console.error('ybytu-create-plan-share-token não respondeu em 5s (timeout)');
        else if (shareTokenResult?.error) console.error('ybytu-create-plan-share-token falhou:', shareTokenResult.error);

        // 6. Mostra tela final de confirmação
        setFinished({ firstName, email, whatsappPhone, emailSent });
      } catch (e) {
        alert(e.message || 'Ocorreu um erro ao salvar o perfil.');
        console.error(e);
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
    }
  };

  if (loading) {
    return (
      <div className="onboarding-app">
        <div className="onboarding-card">
          <div className="loading-box">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Tela final após sucesso
  if (finished) {
    return (
      <div className="onboarding-app">
        <div className="onboarding-card confirmation-card">
          <div className="onboarding-content">
            <div className="conf-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="conf-title">Perfil confirmado, {finished.firstName}!</h1>
            <p className="conf-subtitle">Recebemos suas respostas. Aqui está o que acontece agora:</p>

            <div className="conf-steps">
              <div className="conf-step-item">
                <span className="conf-step-num">1</span>
                <p className="conf-step-text">
                  <strong>Seu plano já está sendo gerado</strong> com base nas suas respostas.
                </p>
              </div>
              <div className="conf-step-item">
                <span className="conf-step-num">2</span>
                <p className="conf-step-text">
                  <strong>Um personal trainer e uma nutricionista revisam</strong> tudo antes de liberar pra você.
                </p>
              </div>
              <div className="conf-step-item">
                <span className="conf-step-num">3</span>
                <p className="conf-step-text">
                  <strong>O link do plano chega pelo seu WhatsApp</strong> assim que a revisão terminar.
                </p>
              </div>
            </div>

            <div className="conf-notice-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F55F16" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span><strong>Prazo de revisão:</strong> em até 48 horas</span>
            </div>

            <div className="conf-whatsapp-recap">
              <div className="label">Vamos te avisar pelo WhatsApp</div>
              <div className="phone-row">
                <span>{maskPhone(finished.whatsappPhone)}</span>
                <span>·</span>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Olá, sou ${finished.firstName} -- o número de WhatsApp que cadastrei está errado, poderiam me ajudar a corrigir?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fix-link"
                >
                  Número errado? Fale com a gente
                </a>
              </div>
            </div>

            {finished.emailSent && (
              <p style={{ fontSize: '13px', color: 'var(--yb-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                Também enviamos um e-mail de confirmação com esse resumo para{' '}
                <strong style={{ color: 'var(--yb-text)' }}>{finished.email}</strong>.
              </p>
            )}

            <div style={{ backgroundColor: 'var(--yb-surface-2)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', lineHeight: '1.5', color: 'var(--yb-muted)' }}>
              <div style={{ fontWeight: 700, color: 'var(--yb-text)', marginBottom: '4px' }}>
                Não recebeu o link dentro do prazo?
              </div>
              Confira se o número do WhatsApp está correto acima
              {finished.emailSent ? ' e olhe sua caixa de spam no e-mail' : ''}. Se ainda assim não chegar, fale com a gente pelo WhatsApp abaixo.
            </div>

            <button type="button" onClick={openTeamWhatsApp} className="btn-team-wa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91S17.5 2 12.04 2Z" />
              </svg>
              Falar com a equipe no WhatsApp (opcional)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentData = visibleSteps[currentStep];

  return (
    <div className="onboarding-app">
      <div className="onboarding-card">
        {/* Barra de Progresso */}
        <div className="onboarding-header">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / visibleSteps.length) * 100}%` }}
            />
          </div>
          <span className="step-label">
            Passo {currentStep + 1}/{visibleSteps.length}
          </span>
        </div>

        {/* Conteúdo Dinâmico com Scroll */}
        <div className="onboarding-content">
          <h2 className="step-title">{currentData.title}</h2>
          <p className="step-subtitle">{currentData.subtitle}</p>

          {currentData.type === 'form' ? (
            <div className="form-fields">
              {currentData.fields.map((field) => {
                if (field.id !== 'whatsapp_phone') {
                  return (
                    <input
                      key={field.id}
                      type={field.type}
                      value={answers[field.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      className="field-input"
                    />
                  );
                }

                const selectedCountry = ALL_COUNTRIES.find((c) => c.iso === whatsappCountry) || ALL_COUNTRIES[0];
                const validation = getPhoneValidation(answers.whatsapp_phone, whatsappCountry);

                return (
                  <div key={field.id} className="phone-field-wrapper">
                    <div className="phone-input-row">
                      <button
                        type="button"
                        onClick={() => {
                          setCountryPickerOpen(true);
                          setCountrySearch('');
                        }}
                        className="country-btn"
                        title="Alterar país / DDI"
                      >
                        <span className="country-flag">{selectedCountry ? selectedCountry.flag : '🌐'}</span>
                        <span className="country-dial">{selectedCountry ? selectedCountry.dial : '+55'}</span>
                        <span className="country-chevron">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </span>
                      </button>

                      <input
                        type="tel"
                        value={answers.whatsapp_phone || ''}
                        onChange={handlePhoneChange}
                        onBlur={() => setPhoneTouched(true)}
                        placeholder={getCountryPlaceholder(whatsappCountry)}
                        autoComplete="tel"
                        className="field-input"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                    </div>

                    {/* Feedback / Validação do WhatsApp */}
                    {(() => {
                      if (!answers.whatsapp_phone || !answers.whatsapp_phone.trim()) {
                        return (
                          <div className="phone-feedback neutral">
                            Informe seu DDD e número de celular para receber o plano por WhatsApp.
                          </div>
                        );
                      }
                      if (!validation.error && validation.preview) {
                        return (
                          <div className="phone-feedback valid">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Número verificado: <strong>{validation.preview}</strong></span>
                          </div>
                        );
                      }
                      const digitsCount = (answers.whatsapp_phone.match(/\d/g) || []).length;
                      if (phoneTouched || digitsCount >= 8) {
                        return (
                          <div className="phone-feedback invalid">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{validation.error || 'Confira o DDD e número digitados.'}</span>
                          </div>
                        );
                      }
                      return (
                        <div className="phone-feedback neutral">
                          Informe seu DDD e número de celular para receber o plano por WhatsApp.
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          ) : currentData.type === 'number' || currentData.type === 'text' ? (
            <input
              type={currentData.type === 'number' ? 'number' : 'text'}
              value={answers[currentData.dbField] || ''}
              onChange={(e) => setAnswers({ ...answers, [currentData.dbField]: e.target.value })}
              placeholder={currentData.placeholder}
              className="field-input"
            />
          ) : currentData.type === 'slider' ? (
            <div className="slider-card">
              <div className="slider-metric">
                {answers[currentData.dbField] || currentData.recommended}
                <span className="unit">{currentData.unit}</span>
              </div>
              <input
                type="range"
                min={currentData.min}
                max={currentData.max}
                step={currentData.step}
                value={answers[currentData.dbField] || currentData.recommended}
                onChange={(e) => setAnswers({ ...answers, [currentData.dbField]: Number(e.target.value) })}
                className="slider-input"
              />
            </div>
          ) : (
            <div className="options-grid">
              {(() => {
                const noneOption = currentData.type === 'multiple' ? findNoneOption(currentData.options) : null;
                const noneSelected = noneOption && (answers[currentData.dbField] || []).includes(noneOption.id);
                const blockedByPreferenceIds =
                  currentData.dbField === 'dietary_restrictions_ids'
                    ? getBlockedRestrictionIds(answers.dietary_preference_id)
                    : [];

                return currentData.options?.map((opt, i) => {
                  const isSelected =
                    currentData.type === 'multiple'
                      ? (answers[currentData.dbField] || []).includes(opt.id)
                      : answers[currentData.dbField] === opt.id;
                  const isDisabled = (noneSelected && opt.id !== noneOption.id) || blockedByPreferenceIds.includes(opt.id);

                  return (
                    <button
                      type="button"
                      key={opt.id || i}
                      onClick={() => !isDisabled && handleSelect(opt.id)}
                      disabled={isDisabled}
                      className={`option-item ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="option-label">{opt.name_ptbr || opt.name}</span>
                      <div className={`option-check ${currentData.type === 'multiple' ? 'check-multiple' : 'check-single'}`}>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Rodapé com Navegação */}
        <div className="onboarding-footer">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="btn-back"
          >
            VOLTAR
          </button>
          <button
            type="button"
            onClick={nextStep}
            disabled={isNextDisabled() || loading}
            className="btn-next"
          >
            {currentStep === visibleSteps.length - 1 ? 'FINALIZAR' : 'PRÓXIMO'}
          </button>
        </div>
      </div>

      {/* Modal de Seleção de País / DDI */}
      {countryPickerOpen && (
        <div
          className="country-modal-overlay"
          onClick={() => {
            setCountryPickerOpen(false);
            setCountrySearch('');
          }}
        >
          <div className="country-modal" onClick={(e) => e.stopPropagation()}>
            <div className="country-modal-header">
              <div>
                <h3 className="country-modal-title">Selecione o país</h3>
                <p className="country-modal-subtitle">Código telefônico (DDI) para seu WhatsApp</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCountryPickerOpen(false);
                  setCountrySearch('');
                }}
                className="btn-modal-close"
                aria-label="Fechar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="country-modal-search">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Buscar país ou código..."
                className="search-input"
                autoFocus
              />
              {countrySearch && (
                <button
                  type="button"
                  onClick={() => setCountrySearch('')}
                  className="btn-clear-search"
                >
                  LIMPAR
                </button>
              )}
            </div>

            <div className="country-modal-list">
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--yb-muted)', fontSize: '14px' }}>
                  Nenhum país encontrado para "{countrySearch}"
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.iso === whatsappCountry;
                  return (
                    <button
                      type="button"
                      key={c.iso}
                      onClick={() => {
                        setWhatsappCountry(c.iso);
                        setCountryPickerOpen(false);
                        setCountrySearch('');
                        if (answers.whatsapp_phone) {
                          try {
                            const ayt = new AsYouType(c.iso);
                            const reformatted = ayt.input(answers.whatsapp_phone);
                            setAnswers((prev) => ({ ...prev, whatsapp_phone: reformatted }));
                          } catch (e) {}
                        }
                      }}
                      className={`country-list-item ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="country-flag">{c.flag}</span>
                      <span className="c-name">{c.name}</span>
                      <span className="c-dial">{c.dial}</span>
                      {isSelected && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F55F16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
