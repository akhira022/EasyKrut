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
- สร้าง·แก้ไข **หนังสือภายนอก** พร้อมพรีวิวสด A4
- บันทึก DRAFT/FINAL, ประวัติเอกสาร
- Export PDF (หน้าพิมพ์) และ Word (`.docx`)
- Feature gate ตามแผน Free/Pro/Business (ยังไม่ต่อ Stripe)

Prototype เดิมถูกลบแล้ว · แผนงานอยู่ที่ `docs/PLAN.md`

## สคริปต์

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | รัน dev server |
| `npm run db:up` | เปิด Postgres |
| `npm run db:migrate` | รัน migration |
| `npm run build` | build production |
