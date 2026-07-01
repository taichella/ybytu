import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Função para Entrar
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Erro ao entrar', error.message);
    setLoading(false);
  }

  // Função para Cadastrar
  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } } // Salva o nome no perfil
    });
    if (error) Alert.alert('Erro no cadastro', error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-bgBody justify-center px-6">
      <View className="w-full max-w-sm mx-auto">
        
        {/* CABEÇALHO */}
        {!isLogin && (
          <TouchableOpacity onPress={() => setIsLogin(true)} className="mb-8 flex-row items-center gap-2">
            <ArrowLeft color="#718096" size={20} />
            <Text className="text-textMuted font-bold">Voltar</Text>
          </TouchableOpacity>
        )}

        <View className="mb-10 text-center items-center">
          {isLogin && (
            <View className="w-16 h-16 rounded-2xl bg-surface mb-6 border border-brand/20 items-center justify-center shadow-sm">
              <Text className="text-brand font-black text-3xl">Y</Text>
            </View>
          )}
          <Text className="text-3xl font-black uppercase tracking-tight mb-2 text-textMain">
            {isLogin ? 'Ybytu' : 'Crie sua Conta'}
          </Text>
          <Text className="text-textMuted">
            {isLogin ? 'Sua evolução começa agora.' : 'Junte-se à comunidade Ybytu.'}
          </Text>
        </View>

        {/* FORMULÁRIO */}
        <View className="gap-4">
          {!isLogin && (
            <View className="relative justify-center">
              <View className="absolute left-4 z-10"><User color="#718096" size={20} /></View>
              <TextInput 
                placeholder="Nome Completo"
                value={name}
                onChangeText={setName}
                className="bg-surface border border-borderColor rounded-xl py-4 pl-12 pr-4 text-textMain"
              />
            </View>
          )}

          <View className="relative justify-center">
            <View className="absolute left-4 z-10"><Mail color="#718096" size={20} /></View>
            <TextInput 
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="bg-surface border border-borderColor rounded-xl py-4 pl-12 pr-4 text-textMain"
            />
          </View>

          <View className="relative justify-center">
            <View className="absolute left-4 z-10"><Lock color="#718096" size={20} /></View>
            <TextInput 
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="bg-surface border border-borderColor rounded-xl py-4 pl-12 pr-4 text-textMain"
            />
          </View>

          {isLogin && (
            <TouchableOpacity className="items-end mt-1">
              <Text className="text-sm text-textMuted font-medium">Esqueceu?</Text>
            </TouchableOpacity>
          )}

          {/* BOTÃO PRINCIPAL */}
          <TouchableOpacity 
            onPress={isLogin ? signInWithEmail : signUpWithEmail}
            disabled={loading}
            className="mt-2 w-full bg-brand py-4 rounded-xl items-center flex-row justify-center gap-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-white font-black text-lg uppercase">
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </Text>
                {isLogin && <ArrowRight color="#fff" size={20} />}
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ALTERNAR TELA */}
        {isLogin && (
          <View className="mt-8 flex-row justify-center gap-1">
            <Text className="text-textMuted">Não tem conta?</Text>
            <TouchableOpacity onPress={() => setIsLogin(false)}>
              <Text className="text-brand font-bold">Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}