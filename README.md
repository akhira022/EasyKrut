# EasyKrut

ระบบสร้างเอกสารราชการอิเล็กทรอนิกส์สำหรับหน่วยงาน (multi-tenant)

## ความต้องการ

- Node.js 20+
- (ทางเลือก) Docker สำหรับ PostgreSQL ในโปรดักชัน

## เริ่มต้น

```bash
# 1) ตั้งค่า env
cp .env.example .env

# 2) ติดตั้งและ migrate (ค่าเริ่มต้นใช้ SQLite ไฟล์ prisma/dev.db)
npm install
npx prisma migrate dev --name init
npm run dev
```

เปิด [http://localhost:3010](http://localhost:3010)

> พอร์ต **3010** ตั้งไว้เพื่อไม่ชน Grafana ที่มักใช้ `:3000` — ค่า `AUTH_URL` ใน `.env` ต้องตรงกับพอร์ตนี้

บัญชีทดลอง (หลังรัน seed):

```bash
node scripts/seed-demo.js
# อีเมล: demo@easykrut.local
# รหัสผ่าน: demo1234
```

ถ้าต้องการ Postgres แทน: เปิด Docker Desktop แล้วรัน `docker compose up -d` จากนั้นปรับ schema/provider และ `DATABASE_URL`

## สิ่งที่ได้ใน MVP

- สมัคร / เข้าสู่ระบบ / เชิญสมาชิกหน่วยงาน
- สร้าง·แก้ไข **หนังสือภายนอก** และ **หนังสือภายใน** พร้อมพรีวิวสด A4
- จุดสร้างเอกสารรวมที่ `/documents/new` + onboarding บนแดชบอร์ด
- บันทึก DRAFT/FINAL, ประวัติเอกสาร
- Export PDF และ Word (`.docx`)
- Feature gate ตามแผน Free/Pro/Business (+ Stripe เมื่อตั้ง env)

Prototype เดิมถูกลบแล้ว  
เอกสารรวมทุกอย่าง: [`docs/OVERVIEW.md`](docs/OVERVIEW.md)  
แผนละเอียด: `docs/PLAN.md` · userflow: `docs/USERFLOW.md`

## สคริปต์

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | รัน dev server |
| `npm run db:up` | เปิด Postgres |
| `npm run db:migrate` | รัน migration |
| `npm run build` | build production |
