# UniCommu Backend

โค้ด API แยกจากหน้าจอ Expo ใน `src/` ของโปรเจกต์หลัก

```text
backend/
├── src/
│   ├── auth/          # สมัครสมาชิก รหัสผ่าน ยืนยันอีเมล และโควต้า OTP
│   ├── database/      # การเชื่อมต่อ PostgreSQL / MySQL
│   ├── email/         # ส่งอีเมลผ่าน SMTP
│   ├── http/          # อ่านและตรวจ request
│   └── server.mjs     # จุดเริ่มต้น API และเส้นทาง endpoint
├── scripts/           # คำสั่งตรวจระบบ เช่น ตรวจการเชื่อมต่อ SMTP
├── tests/             # ทดสอบการทำงาน
├── docs/              # นโยบายรหัสผ่านและโควต้า OTP
├── .env.example       # ตัวอย่างค่าตั้งค่า ไม่มีรหัสลับ
└── package.json       # dependencies และคำสั่ง npm
```

ไฟล์ `.env` เป็นค่าของเครื่องนี้และถูก Git ignore ส่วน `supabase-ca.crt`
เป็นใบรับรองสาธารณะ โดยคงตำแหน่งเดิมไว้เพื่อให้การตั้งค่าใบรับรองเดิมยังใช้ได้

รันจากโฟลเดอร์หลักของโปรเจกต์:

```powershell
npm.cmd --prefix backend start
npm.cmd --prefix backend test
npm.cmd --prefix backend run check:email
```

คำสั่ง `check:email` ตรวจการเชื่อมต่อและยืนยันตัวตน SMTP โดยไม่ส่งอีเมล
Integration tests ที่ต่อฐานข้อมูลต้องเปิดใช้งานตาม [คู่มือ OTP](docs/OTP_QUOTA.md)

สคริปต์สร้างตารางอยู่ที่ `database/migrations/` สำหรับ MySQL และ
`supabase/migrations/` สำหรับ PostgreSQL โดยอ้างอิงจากโฟลเดอร์หลักของโปรเจกต์

ดูการทำงานของล็อกอินและ session ที่ [คู่มือล็อกอิน](docs/LOGIN.md)
