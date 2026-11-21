import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { seedItems } from './mock-data';
import { useCommunityPosts } from './use-community-posts';

export type { CommunityComment } from './community-api';

function useDemoState() {
  const postsApi = useCommunityPosts();
  const [announcementSaved, setAnnouncementSaved] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [reported, setReported] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) => setter(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  return { ...postsApi, items: [...seedItems.filter(i=>i.kind==='announcement'), ...postsApi.posts], saved:[...announcementSaved,...postsApi.saved], following, reported, read,
    toggleSaved: (id: string) => seedItems.some(item=>item.kind==='announcement'&&item.id===id) ? toggle(setAnnouncementSaved,id) : void postsApi.toggleSaved(id),
    toggleLiked: (id: string) => void postsApi.toggleLiked(id),
    toggleFollow: (name: string) => toggle(setFollowing, name),
    report: async (id: string) => { const success=await postsApi.report(id); if(success) setReported(old => old.includes(id) ? old : [...old,id]); },
    markRead: (id: string) => setRead(old => old.includes(id) ? old : [...old, id]),
  };
}
type DemoState = ReturnType<typeof useDemoState>;
const DemoContext = createContext<DemoState | null>(null);
function SessionCommunity({ children }: { children: ReactNode }) { return <DemoContext.Provider value={useDemoState()}>{children}</DemoContext.Provider>; }
export function DemoProvider({ children }: { children: ReactNode }) { const {session}=useAuth(); return <SessionCommunity key={session?.token??'guest'}>{children}</SessionCommunity>; }
export function useDemo() { const state = useContext(DemoContext); if (!state) throw new Error('DemoProvider is required'); return state; }
