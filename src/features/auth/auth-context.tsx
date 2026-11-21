import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { logoutAccount, type AuthSession } from './registration-api';
type Session = (AuthSession & { name: string }) | null;
const Context = createContext<{ session: Session; enter: (value: AuthSession) => void; logout: () => void } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => setSession(null), Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);
  function logout() {
    const token = session?.token;
    setSession(null);
    if (token) void logoutAccount(token).catch(() => {
      // Local credentials are gone; an unreachable server session expires automatically.
      console.warn('ออกจากเครื่องแล้ว แต่ติดต่อเซิร์ฟเวอร์เพื่อยกเลิกเซสชันไม่ได้');
    });
  }
  return <Context.Provider value={{ session, enter: (value) => setSession({ ...value, name: value.user.name }), logout }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider missing'); return value; }
