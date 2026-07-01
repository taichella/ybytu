import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  
  // Novos estados para UX
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return alert("Preencha todos os campos!");
    }
    if (password !== confirmPassword) {
      return alert("As senhas não coincidem!");
    }

    setLoading(true);

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const { data, error } = await supabase.auth.signUp({ 
      email: email.trim(), 
      password: password,
      options: {
        data: {
          full_name: name.trim(),
          first_name: firstName,
          last_name: lastName
        },
        emailRedirectTo: Platform.OS === 'web' ? window.location.origin : undefined
      }
    });

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({ 
        id: data.user.id,
        full_name: name.trim(),
        first_name: firstName,
        last_name: lastName
      });
      if (profileError) console.log("Erro silencioso ao salvar perfil:", profileError.message);
    }

    if (data?.user && !data?.session) {
      alert("Sucesso! 🎉\nEnviamos um link de confirmação para o seu e-mail. Por favor, verifique a sua caixa de entrada (ou spam) para ativar a conta.");
      navigation.navigate('Login'); 
    } else {
      console.log("Conta criada sem necessidade de e-mail.");
    }
    
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bgBody px-6 pt-12 items-center">
      <View className="w-full max-w-md">
        
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8 flex-row items-center gap-2">
          <ArrowLeft size={20} color="#9C9C9C" />
          <Text className="text-textMuted font-bold">Voltar</Text>
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-3xl font-black uppercase tracking-tight mb-2 text-textMain">Crie sua Conta</Text>
          <Text className="text-textMuted font-bold">Junte-se à comunidade Ybytu.</Text>
        </View>

        <View className="space-y-4 mb-8">
          <View className="relative justify-center">
            <View className="absolute left-4 z-10"><User size={20} color="#9C9C9C" /></View>
            <TextInput 
              value={name} onChangeText={setName} placeholder="Nome Completo" 
              className="bg-surface w-full rounded-xl py-4 pl-12 pr-4 border border-borderColor text-textMain font-medium outline-none" 
            />
          </View>
          
          <View className="relative justify-center">
            <View className="absolute left-4 z-10"><Mail size={20} color="#9C9C9C" /></View>
            <TextInput 
              value={email} onChangeText={setEmail} placeholder="E-mail" 
              autoCapitalize="none" keyboardType="email-address" 
              className="bg-surface w-full rounded-xl py-4 pl-12 pr-4 border border-borderColor text-textMain font-medium outline-none" 
            />
          </View>
          
          <View className="relative justify-center">
            <View className="absolute left-4 z-10"><Lock size={20} color="#9C9C9C" /></View>
            <TextInput 
              value={password} onChangeText={setPassword} placeholder="Senha" 
              secureTextEntry={!showPassword} 
              className="bg-surface w-full rounded-xl py-4 pl-12 pr-12 border border-borderColor text-textMain font-medium outline-none" 
            />
            {/* Botão do Olho - Senha */}
            <TouchableOpacity 
              className="absolute right-4 z-10 p-1" 
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} color="#9C9C9C" /> : <Eye size={20} color="#9C9C9C" />}
            </TouchableOpacity>
          </View>

          <View className="relative justify-center">
            <View className="absolute left-4 z-10"><Lock size={20} color="#9C9C9C" /></View>
            <TextInput 
              value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirmar Senha" 
              secureTextEntry={!showConfirmPassword} 
              onSubmitEditing={handleRegister}
              className="bg-surface w-full rounded-xl py-4 pl-12 pr-12 border border-borderColor text-textMain font-medium outline-none" 
            />
            {/* Botão do Olho - Confirmar Senha */}
            <TouchableOpacity 
              className="absolute right-4 z-10 p-1" 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} color="#9C9C9C" /> : <Eye size={20} color="#9C9C9C" />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleRegister} disabled={loading} className="w-full bg-brand py-4 rounded-xl shadow-lg items-center justify-center">
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-lg uppercase">CRIAR CONTA</Text>}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}