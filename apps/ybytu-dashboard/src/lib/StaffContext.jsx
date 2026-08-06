import { StaffContext } from './staffContextCore';

export function StaffProvider({ value, children }) {
  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}
