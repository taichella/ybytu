import { createContext, useContext } from 'react';

// Preenchido pelo DashboardLayout depois que ybytu-whoami confirma staff.
// { fullName, roles: string[] } -- roles nunca vem de user_metadata, sempre
// do servidor. Usado pra telas se esconderem/mostrarem por papel (ex: o
// formulário de parecer nutricional só aparece se 'nutricionista' ∈ roles).
const StaffContext = createContext(null);

export function StaffProvider({ value, children }) {
  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  return useContext(StaffContext);
}
