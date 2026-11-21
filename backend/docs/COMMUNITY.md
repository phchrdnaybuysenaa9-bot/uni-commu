# Community API

ฟีดชุมชนใช้ PostgreSQL ใน schema `unicommu` ผ่าน backend เดิมและ bearer session จากระบบล็อกอิน ทุก endpoint ต้องมีอีเมลที่ยืนยันแล้วและ session ที่ยังไม่หมดอายุ ไม่ใช้ Supabase Auth JWT และไม่ส่ง database/Storage secret ไปใน Expo

## เริ่มใช้งาน

รันจากโฟลเดอร์หลัก:

```powershell
npm.cmd --prefix backend run migrate:community
npm.cmd --prefix backend start
```

Migration PostgreSQL: `supabase/migrations/20261121090000_community.sql` เพิ่มเฉพาะตารางใหม่ พร้อม FK, indexes และ RLS ไม่ seed โพสต์ บัญชี หรือชื่อคณะ สคริปต์ตรวจ checksum และบันทึก migration history ป้องกันรันซ้ำ ส่วน MySQL 8.0.16+ ใช้ `database/migrations/005_community.sql` หลัง 001–004; ชุดทดสอบ SQL อัตโนมัติและฐานข้อมูลที่เชื่อมจริงในรอบนี้เป็น PostgreSQL

ตารางหลัก: `posts`, `post_media`, `hashtags`, `post_hashtags`, `post_likes`, `post_bookmarks`, `comments`, `comment_likes`, `post_reports`

ตารางจัดหมวดหมู่: `campuses`, `faculties`, `programs`, `campus_faculties`, `post_faculties`, `post_programs`

ตารางสิทธิ์สโม: `organizations`, `organization_faculties`, `organization_members` ผู้ดูแลที่เชื่อถือได้ต้องเพิ่มรายชื่อคณะ/สาขาและสมาชิกองค์กรตามข้อมูลจริงก่อนใช้งาน การสมัครบัญชีหรือมี role `department` อย่างเดียวไม่ได้สิทธิ์จัดหมวดหมู่

## Endpoints

| Method | Path | การทำงาน |
| --- | --- | --- |
| GET | `/community/posts` | ฟีดใหม่สุด แบ่งหน้าด้วย cursor |
| POST | `/community/posts` | สร้างโพสต์โดยใช้ผู้ใช้จาก session |
| GET | `/community/posts/:id` | รายละเอียดโพสต์ |
| PUT / DELETE | `/community/posts/:id/like` | กดใจ / เลิกกดใจ |
| PUT / DELETE | `/community/posts/:id/bookmark` | บันทึก / เลิกบันทึก |
| GET / POST | `/community/posts/:id/comments` | อ่านความคิดเห็น / ส่งความคิดเห็นหรือตอบกลับ |
| PUT / DELETE | `/community/comments/:id/like` | กดใจ / เลิกกดใจความคิดเห็น |
| PUT | `/community/posts/:id/report` | บันทึกรายงานให้ผู้ดูแลตรวจสอบภายหลัง |
| GET | `/community/catalog` | รายชื่อศูนย์ คณะ สาขา ความสัมพันธ์ และสถานะการแนบรูป |
| PUT | `/community/posts/:id/labels` | สโม/สภาฯ/แอดมินระบุหลายคณะหรือสาขา |
| POST | `/community/media` | อัปโหลดรูปของผู้ใช้ปัจจุบัน |

ฟีดรองรับ `limit` 1–30 (default 20), `cursor`, `category`, `q`, `facultyId`, `mine=1`, `saved=1` คำค้นใช้ parameterized SQL และ escape wildcard มีลำดับแน่นอนด้วย `created_at,id` คืน `items,nextCursor` ส่วน comment คืนครั้งละ 100 รายการพร้อม cursor

สร้างโพสต์:

```json
{
  "body": "ชวนเพื่อนทำกิจกรรม #ศูนย์A",
  "category": "กิจกรรม",
  "mediaIds": [],
  "clientRequestId": "unique_request_000001"
}
```

ข้อความ 1–2,000 Unicode code points หมวดหมู่: `เรื่องเรียน`, `กิจกรรม`, `ชีวิตในมหาวิทยาลัย` แฮชแท็กเป็นตัวเลือก แยกจากข้อความอัตโนมัติและไม่ซ้ำ สูงสุด 20 แท็ก แท็กละ 80 ตัวอักษร ส่ง `authorId`, role หรือป้ายคณะมากับ POST ไม่ได้

`clientRequestId` เป็นค่าคงที่ของการส่งครั้งนั้น หากเครือข่ายหลุดให้ส่งซ้ำด้วยค่าเดิมและเนื้อหาเดิม เซิร์ฟเวอร์คืนโพสต์เดิม ไม่สร้างซ้ำ หากเนื้อหาต่างกันได้ 409 ความคิดเห็นใช้หลักเดียวกัน พร้อม `parentId` ของความคิดเห็นหลักในโพสต์เดียวกัน ไลก์/บันทึกเป็น PUT/DELETE ที่ทำซ้ำได้อย่างปลอดภัยและมี unique key คู่โพสต์/บัญชี

## การระบุหลายคณะ/สาขา

`PUT /community/posts/:id/labels` รับ `{ "facultyIds": ["uuid"], "programIds": ["uuid"] }` และรองรับหลายรายการ สาขาจะเพิ่มคณะต้นสังกัดให้ด้วย สโมแก้ได้เฉพาะคณะใน `organization_faculties` ที่ตนมีสมาชิกซึ่งผู้ดูแลอนุมัติ สภานักศึกษาและ admin จัดได้ทุกคณะ การอัปเดตแทนที่ป้ายเฉพาะขอบเขตของผู้กระทำ จึงไม่ลบป้ายคณะของสโมอื่น บันทึก `assigned_by,assigned_at` ต่อความสัมพันธ์

API พร้อมใช้งาน แต่ยังไม่มีหน้าจอจัดการสมาชิกองค์กรหรือหน้าจอให้สโมเลือกคณะในรอบนี้ หน้าประกาศและการติดตามองค์กรยังใช้แหล่งข้อมูลเดิม แยกจาก API โพสต์

## รูปภาพ

ตั้งค่าใน `backend/.env` และ Render backend เท่านั้น:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
```

ใช้ Secret key ที่ขึ้นต้น `sb_secret_` จาก Supabase → Settings → API Keys ส่งผ่าน `apikey` header เท่านั้น ถ้าโปรเจกต์ยังใช้คีย์ JWT แบบเดิม รองรับ `SUPABASE_SERVICE_ROLE_KEY` เป็น fallback ด้วย ห้ามใช้ prefix `EXPO_PUBLIC_` กับ secret จากนั้นรัน `npm.cmd --prefix backend run setup:storage` เพื่อสร้าง private bucket `unicommu-posts` และรีสตาร์ต backend

อัปโหลดด้วย `{ "base64": "..." }` สูงสุด 5 MB รองรับภาพนิ่ง JPEG/PNG/WebP เซิร์ฟเวอร์ decode ตรวจชนิดจริงและจำกัด 25 ล้านพิกเซลก่อนหมุนตาม orientation, ย่อไม่เกิน 1920×1920, encode WebP ใหม่และตัด metadata ที่ฝังในรูป รูปใน DB เป็นตำแหน่ง Storage และขนาด ไม่เก็บ base64 ส่วน URL ที่เซ็นให้ดูรูปมีอายุ 1 ชั่วโมง โหลดฟีดใหม่เพื่อรับลิงก์ใหม่

API รองรับรูปสูงสุด 8 รูปต่อโพสต์ หน้าสร้างโพสต์รอบนี้ให้แนบและแสดง 1 รูป รูปที่อัปโหลดต้องเป็นของบัญชีเดียวกันและยังไม่ผูกกับโพสต์อื่น หากยังไม่ตั้งค่า Storage แอปยังโพสต์ข้อความได้ มีเพดานรูปที่ยังไม่เผยแพร่ 16 รูปต่อบัญชี ควรเพิ่มงานล้างไฟล์ที่ถูกทิ้งก่อนเปิดรับใช้งานวงกว้าง

## ตรวจสอบ

```powershell
npm.cmd --prefix backend test
```

ชุดทดสอบใช้ PostgreSQL แยกใน PGlite ไม่มีการส่ง OTP หรืออีเมล ทดสอบการเก็บข้อมูล การส่งซ้ำ สิทธิ์หลายคณะ การแยกบัญชี pagination ความคิดเห็นข้ามโพสต์ รูป และ RLS

ทดสอบกับ PostgreSQL ที่ตั้งค่าไว้ (รันใน `backend/`):

```powershell
$env:RUN_COMMUNITY_DB_TESTS='true'
node --env-file-if-exists=.env --test tests/community.integration.test.mjs
```

ใช้บัญชี/โพสต์สังเคราะห์ใน transaction และ rollback ทั้งหมดหลังตรวจสอบ ไม่ส่งอีเมล
