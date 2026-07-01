import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Novo estado
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return alert("Preencha todos os campos!");
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("Erro ao entrar: " + error.message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bgBody justify-center px-6">
      <View className="items-center mb-10">
        <View className="w-16 h-16 rounded-2xl bg-surface items-center justify-center mb-6 shadow-xl border border-brand/20">
          <Text className="text-brand font-black text-3xl">Y</Text>
        </View>
        <Text className="text-3xl font-black uppercase tracking-tight mb-2 text-textMain">Ybytu</Text>
        <Text className="text-textMuted font-bold">Sua evolução começa agora.</Text>
      </View>

      <View className="space-y-4 mb-8">
        <View className="relative justify-center">
          <View className="absolute left-4 z-10"><Mail size={20} color="#9C9C9C" /></View>
          <TextInput 
            value={email} onChangeText={setEmail} placeholder="E-mail" 
            autoCapitalize="none" keyboardType="email-address"
            className="bg-surface w-full rounded-xl py-4 pl-12 pr-4 border border-borderColor text-textMain font-medium" 
          />
        </View>

        <View className="relative justify-center">
          <View className="absolute left-4 z-10"><Lock size={20} color="#9C9C9C" /></View>
          <TextInput 
            value={password} onChangeText={setPassword} placeholder="Senha" 
            secureTextEntry={!showPassword} // Controle de visualização
            className="bg-surface w-full rounded-xl py-4 pl-12 pr-12 border border-borderColor text-textMain font-medium" 
          />
          {/* Botão do Olho */}
          <TouchableOpacity 
            className="absolute right-4 z-10 p-1" 
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} color="#9C9C9C" /> : <Eye size={20} color="#9C9C9C" />}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={handleLogin} disabled={loading} className="w-full bg-brand py-4 rounded-xl shadow-lg flex-row items-center justify-center gap-2">
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Text className="text-white font-black text-lg uppercase">ENTRAR</Text>
            <ArrowRight size={20} color="#fff" strokeWidth={3} />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} className="mt-8 items-center">
        <Text className="text-textMuted font-bold">Não tem conta? <Text className="text-brand">Cadastre-se</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}