export type PostPhoto = 'study' | 'people';
export type ContentItem = {
  id: string;
  kind: 'post' | 'announcement';
  author: string;
  faculty: string;
  category: string;
  title: string;
  body: string;
  tags: string[];
  date: string;
  likes: number;
  verified?: boolean;
  urgent?: boolean;
  pinned?: boolean;
  photo?: PostPhoto;
};
export const demoToday = '2026-10-23';
export const seedItems: ContentItem[] = [
  { id: 'a1', kind: 'announcement', author: 'กองพัฒนานักศึกษา', faculty: 'ทุกคณะ', category: 'บริการนักศึกษา', title: 'แจ้งปิดปรับปรุงระบบลงทะเบียนชั่วคราว', body: 'ระบบจะปิดให้บริการวันที่ 24 ต.ค. เวลา 00.00–06.00 น. กรุณาวางแผนการลงทะเบียนล่วงหน้า หากมีข้อสงสัย ติดต่อหน่วยงานในเวลาทำการ', tags: ['ลงทะเบียน', 'ระบบบริการ'], date: demoToday, likes: 0, verified: true, urgent: true, pinned: true },
  { id: 'a2', kind: 'announcement', author: 'คณะวิทยาศาสตร์และเทคโนโลยี', faculty: 'วิทยาศาสตร์และเทคโนโลยี', category: 'กิจกรรม', title: 'เปิดรับสมัครเวิร์กช็อป ออกแบบแอปแรกของคุณ', body: 'ชวนเพื่อน ๆ มาลองออกแบบแอปด้วยกัน ไม่จำเป็นต้องมีพื้นฐาน รับสมัครถึงวันที่ 30 ต.ค. รายละเอียดนี้เป็นเพียงตัวอย่างสำหรับต้นแบบ', tags: ['เวิร์กช็อป', 'เทคโนโลยี'], date: '2026-10-22', likes: 0, verified: true },
  { id: 'a3', kind: 'announcement', author: 'คณะบริหารธุรกิจ', faculty: 'บริหารธุรกิจ', category: 'ทุนการศึกษา', title: 'ทุนสนับสนุนการศึกษาประจำภาคเรียน', body: 'เตรียมเอกสารและตรวจสอบคุณสมบัติกับงานกิจการนักศึกษา ข้อมูลกำหนดการทั้งหมดในหน้านี้เป็นข้อมูลจำลอง', tags: ['ทุนการศึกษา'], date: '2026-10-20', likes: 0, verified: true },
  { id: 'p1', photo: 'study', kind: 'post', author: 'มะปราง', faculty: 'วิทยาศาสตร์และเทคโนโลยี', category: 'เรื่องเรียน', title: 'มีใครมีมุมอ่านหนังสือเงียบ ๆ แนะนำบ้าง', body: 'ช่วงนี้กำลังเตรียมสอบ อยากหาที่นั่งอ่านช่วงบ่ายที่มีปลั๊กไฟด้วย ใครมีมุมโปรดในมหาวิทยาลัย มาแชร์กันได้นะ', tags: ['อ่านหนังสือ', 'ชีวิตในรั้วมหาวิทยาลัย'], date: demoToday, likes: 24 },
  { id: 'p2', photo: 'people', kind: 'post', author: 'ต้นกล้า', faculty: 'บริหารธุรกิจ', category: 'กิจกรรม', title: 'หาเพื่อนร่วมทีมทำกิจกรรมอาสา', body: 'วันหยุดนี้อยากชวนเพื่อน ๆ ไปช่วยจัดหนังสือที่ห้องสมุด ใครสนใจคอมเมนต์ไว้ได้เลย ยินดีรู้จักเพื่อนต่างคณะครับ', tags: ['จิตอาสา', 'หาเพื่อน'], date: '2026-10-22', likes: 18 },
  { id: 'p3', photo: 'study', kind: 'post', author: 'พลอย', faculty: 'วิทยาศาสตร์และเทคโนโลยี', category: 'ชีวิตในมหาวิทยาลัย', title: 'เจอบัตรนักศึกษาตกอยู่หน้าห้องสมุด', body: 'ฝากไว้ที่เคาน์เตอร์เจ้าหน้าที่แล้วนะคะ ใครทำหายลองติดต่อรับคืนได้เลย ไม่ลงรูปบัตรเพื่อรักษาข้อมูลส่วนตัวค่ะ', tags: ['ของหาย'], date: '2026-10-21', likes: 32 },
];
