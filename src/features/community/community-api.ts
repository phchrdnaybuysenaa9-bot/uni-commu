import { apiUrl } from '@/features/auth/registration-api';
import type { ContentItem } from './mock-data';

export type ApiPost = {
  id: string;
  author: { id: string; name: string };
  title: string;
  body: string;
  category: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  tags: string[];
  media: { id: string; url: string; width: number; height: number }[];
  faculties: { id: string; name: string }[];
  programs: { id: string; name: string; facultyId: string }[];
};
export type CommunityComment = {
  id: string;
  author: string;
  authorId: string;
  body: string;
  createdAt: number;
  parentId: string | null;
  liked: boolean;
  likeCount?: number;
};
const messages: Record<string, string> = {
  session_expired: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
  community_unavailable: 'โหลดข้อมูลชุมชนไม่ได้ กรุณาลองอีกครั้ง',
  invalid_post: 'กรุณากรอกโพสต์ไม่เกิน 2,000 ตัวอักษร และแฮชแท็กไม่เกิน 20 แท็ก',
  invalid_comment: 'กรุณากรอกความคิดเห็นไม่เกิน 2,000 ตัวอักษร',
  invalid_reply: 'ไม่พบความคิดเห็นที่ต้องการตอบกลับ กรุณาโหลดใหม่',
  invalid_media: 'รูปนี้ใช้กับโพสต์ไม่ได้ กรุณาเลือกรูปใหม่',
  media_not_configured: 'ระบบแนบรูปยังไม่พร้อม สามารถเผยแพร่ข้อความก่อนได้',
  media_unavailable: 'อัปโหลดรูปไม่ได้ กรุณาลองอีกครั้ง',
  invalid_image: 'กรุณาใช้รูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB',
  image_too_large: 'รูปใหญ่เกิน 5 MB กรุณาเลือกรูปขนาดเล็กลง',
  upload_limit: 'มีรูปที่ยังไม่ได้เผยแพร่หลายรูป กรุณาลองใหม่ภายหลัง',
  upload_busy: 'ระบบกำลังอัปโหลดหลายรูป กรุณาลองอีกครั้ง',
  request_conflict: 'รายการนี้เปลี่ยนแปลงแล้ว กรุณาลองส่งใหม่',
  post_not_found: 'ไม่พบโพสต์นี้',
};
export async function communityRequest<T>(
  token: string,
  path: string,
  method = 'GET',
  data?: object,
): Promise<T> {
  if (!apiUrl) throw new Error('ยังไม่ได้ตั้งค่าที่อยู่ Backend สำหรับอุปกรณ์นี้');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, '')}/community${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(data ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
        signal: controller.signal,
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(messages[result.error] ?? 'ทำรายการไม่ได้ กรุณาลองอีกครั้ง');
    return result as T;
  } catch (error) {
    if (
      controller.signal.aborted ||
      error instanceof TypeError ||
      error instanceof SyntaxError
    )
      throw new Error('ติดต่อระบบไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export const requestId = () =>
  `request_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
export function contentFromApi(post: ApiPost): ContentItem {
  const first = post.media[0];
  return {
    id: post.id,
    kind: 'post',
    live: true,
    authorId: post.author.id,
    author: post.author.name,
    title: post.title,
    body: post.body,
    category: post.category,
    tags: post.tags,
    date: post.createdAt.slice(0, 10),
    createdAt: post.createdAt,
    faculty: post.faculties.map((f) => f.name).join(' · '),
    faculties: post.faculties,
    programs: post.programs,
    likes: post.likeCount,
    commentCount: post.commentCount,
    ...(first
      ? { photo: { uri: first.url, width: first.width, height: first.height } }
      : {}),
  };
}
