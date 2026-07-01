import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell, User } from 'lucide-react-native';

export default function Topbar({ title, subtitle }) {
  return (
    <View className="px-6 pt-8 pb-4 flex-row justify-between items-center bg-bgBody border-b border-borderColor">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity className="w-12 h-12 rounded-full bg-surface border border-borderColor items-center justify-center overflow-hidden hover:bg-brand/5 transition-colors">
          <User size={24} color="#F55F16" />
        </TouchableOpacity>
        <View>
          <Text className="text-textMuted font-bold text-xs uppercase tracking-wider">{subtitle}</Text>
          <Text className="text-textMain font-black text-xl">{title}</Text>
        </View>
      </View>
      
      <TouchableOpacity className="w-10 h-10 rounded-full bg-surface border border-borderColor items-center justify-center relative hover:bg-brand/5 transition-colors">
        <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand z-10" />
        <Bell size={20} color="#9C9C9C" />
      </TouchableOpacity>
    </View>
  );
}