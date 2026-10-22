import { createContext, useContext, useState, type ReactNode } from 'react';
type Session = { name: string } | null;
const Context = createContext<{ session: Session; enter: (name?: string) => void; logout: () => void } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  return <Context.Provider value={{ session, enter: (name = 'เพื่อนในมหาวิทยาลัย') => setSession({ name }), logout: () => setSession(null) }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider missing'); return value; }
