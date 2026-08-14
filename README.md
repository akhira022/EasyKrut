# EasyKrut

ระบบสร้างเอกสารราชการอิเล็กทรอนิกส์สำหรับหน่วยงาน (multi-tenant)

**สถานะปัจจุบัน:** MVP พร้อมใช้ — ภายนอก + ภายใน (บันทึกข้อความ) + ประทับตรา  
**ชิ้นถัดไป:** หนังสือสั่งการ (คำสั่ง)  
**เอกสาร:** [`docs/OVERVIEW.md`](docs/OVERVIEW.md) (v1.4) · [`docs/PLAN.md`](docs/PLAN.md) · [`docs/USERFLOW.md`](docs/USERFLOW.md)

## ความต้องการ

- Node.js 20+
- (ทางเลือก) Docker สำหรับ PostgreSQL ในโปรดักชัน

## เริ่มต้น

```bash
# 1) ตั้งค่า env
cp .env.example .env

# 2) ติดตั้งและ migrate (ค่าเริ่มต้นใช้ SQLite ไฟล์ prisma/dev.db)
npm install
npx prisma migrate dev
npm run dev
```

เปิด [http://localhost:3010](http://localhost:3010)

> พอร์ต **3010** ตั้งไว้เพื่อไม่ชน Grafana ที่มักใช้ `:3000` — ค่า `AUTH_URL` ใน `.env` ต้องตรงกับพอร์ตนี้

บัญชีทดลอง:

```bash
npm run db:seed
# อีเมล: demo@easykrut.local
# รหัสผ่าน: demo1234
```

ถ้าต้องการ Postgres: `docker compose up -d` แล้วปรับ provider / `DATABASE_URL`

## สิ่งที่ได้ตอนนี้

- สมัคร / เข้าสู่ระบบ / เชิญสมาชิกหน่วยงาน
- สร้าง·แก้ไข **หนังสือภายนอก** · **หนังสือภายใน** · **หนังสือประทับตรา** พร้อมพรีวิวสด A4
- จุดสร้างรวมที่ `/documents/new` + onboarding บนแดชบอร์ด
- บันทึก DRAFT/FINAL, autosave, ค้นหา, คัดลอก
- Export PDF (`@react-pdf/renderer`) และ Word (`.docx`)
- Feature gate Free/Pro/Business (+ Stripe เมื่อตั้ง env)

## สแต็กหลัก

Next.js 16 · React 19 · Prisma 5 + SQLite · Auth.js v5 · Zod 4 · Stripe

## สคริปต์

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | รัน dev server :3010 |
| `npm run db:up` | เปิด Postgres (Docker) |
| `npm run db:migrate` | รัน migration |
| `npm run db:seed` | สร้างบัญชี demo |
| `npm run build` | build production |
| `npm run lint` | ESLint |

## Debt ที่รู้แล้ว

- lint `useEffectEvent` ใน editor
- ย้าย `middleware` → `proxy` (Next.js 16)
- ปรับ seed script ให้ผ่าน eslint
