import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home, Utensils, Dumbbell, User } from 'lucide-react-native';

export default function Navbar({ activeRoute, navigation }) {
  const brandColor = "#F55F16";
  const inactiveColor = "#9C9C9C";

  const navItems = [
    { name: 'Home', icon: Home, label: 'Início' },
    { name: 'Training', icon: Dumbbell, label: 'Treino' },
    { name: 'Nutrition', icon: Utensils, label: 'Dieta' },
    { name: 'Profile', icon: User, label: 'Perfil' },
  ];

  return (
    <View className="absolute bottom-0 w-full bg-surface border-t border-borderColor px-6 py-4 flex-row justify-between items-center shadow-2xl">
      {navItems.map((item) => {
        const isActive = activeRoute === item.name;
        const IconComponent = item.icon;
        
        return (
          <TouchableOpacity 
            key={item.name}
            onPress={() => navigation.navigate(item.name)}
            className="items-center justify-center w-16 hover:opacity-80 transition-opacity"
          >
            <View className={`p-2 rounded-xl ${isActive ? 'bg-brand/10' : 'bg-transparent'}`}>
              <IconComponent 
                size={24} 
                color={isActive ? brandColor : inactiveColor} 
                strokeWidth={isActive ? 2.5 : 2}
              />
            </View>
            <Text className={`text-[10px] mt-1 font-bold ${isActive ? 'text-brand' : 'text-textMuted'}`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}