import { createContext, useContext, useState, type ReactNode } from 'react';
import { seedItems, type ContentItem, type PostPhoto, demoToday } from './mock-data';
function useDemoState() {
  const [items, setItems] = useState(seedItems);
  const [saved, setSaved] = useState<string[]>(['p1', 'a3', 'p2']);
  const [liked, setLiked] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>(['กองพัฒนานักศึกษา', 'คณะวิทยาศาสตร์และเทคโนโลยี']);
  const [reported, setReported] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [read, setRead] = useState<string[]>([]);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) => setter(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  return { items, saved, liked, following, reported, comments, read,
    toggleSaved: (id: string) => toggle(setSaved, id),
    toggleLiked: (id: string) => toggle(setLiked, id),
    toggleFollow: (name: string) => toggle(setFollowing, name),
    report: (id: string) => setReported(old => old.includes(id) ? old : [...old, id]),
    addComment: (id: string, body: string) => setComments(old => ({ ...old, [id]: [...(old[id] ?? []), body.trim()] })),
    markRead: (id: string) => setRead(old => old.includes(id) ? old : [...old, id]),
    publish: (body: string, photo?: PostPhoto) => setItems(old => [{ id: `p-${Date.now()}`, kind: 'post', author: 'คุณ', faculty: 'วิทยาศาสตร์และเทคโนโลยี', category: 'ชีวิตในมหาวิทยาลัย', title: 'เรื่องเล่าจากคุณ', photo, body: body.trim(), tags: [], date: demoToday, likes: 0 } satisfies ContentItem, ...old]),
  };
}
type DemoState = ReturnType<typeof useDemoState>;
const DemoContext = createContext<DemoState | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) { return <DemoContext.Provider value={useDemoState()}>{children}</DemoContext.Provider>; }
export function useDemo() { const state = useContext(DemoContext); if (!state) throw new Error('DemoProvider is required'); return state; }
