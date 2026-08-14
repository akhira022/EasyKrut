# EasyKrut — เอกสารรวม (Overview)

**เวอร์ชัน:** 1.6  
**สถานะเอกสาร:** ตรงกับโค้ดบน `cursor/next-doc-types-efc5` (14 ส.ค. 2026)

เอกสารฉบับนี้รวมภาพผลิตภัณฑ์ สถานะปัจจุบัน เส้นทางผู้ใช้ สถาปัตยกรรม แผนราคา โรดแมป และปัญหาที่เจอไว้ที่เดียว  
แผนละเอียด: [`PLAN.md`](PLAN.md) · Userflow: [`USERFLOW.md`](USERFLOW.md)

**อัปเดตล่าสุด:** Version 1.6 — คำสั่ง · ประกาศ · รับรอง · รายงานการประชุม เปิดใน `/documents/new`

---

## 1. ผลิตภัณฑ์คืออะไร

**EasyKrut** = ระบบสร้างเอกสารราชการอิเล็กทรอนิกส์แบบ multi-tenant สำหรับหน่วยงาน

- สร้างหนังสือตามรูปแบบสารบรรณ (พรีวิว A4 สด)
- ทำงานร่วมกันในหน่วยงาน (Organization)
- ส่งออก PDF / Word
- มีแผน Free / Pro / Business + feature gate (Stripe เปิดเมื่อตั้ง env)

**เป้าหมายธุรกิจ:** เริ่มใช้จริงในหน่วยงาน → ขยายเป็น SaaS

**สแต็ก:** Next.js 16.3 · React 19 · Prisma 5 + SQLite (local) · Auth.js v5 · Zod 4 · พอร์ต `3010`

---

## 2. สถานะปัจจุบัน (ตรงกับโค้ด)

| หัวข้อ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| สมัคร / เข้าสู่ระบบ / ออกจากระบบ | ✅ | Auth.js credentials |
| สร้างหน่วยงานอัตโนมัติตอนสมัคร | ✅ | OWNER + แผน Free |
| เชิญสมาชิก (invite token) | ✅ | `/org/settings` + `/invite/[token]` |
| หนังสือภายนอก (ตราครุฑ) | ✅ | form + preview + PDF + Word |
| หนังสือภายใน (บันทึกข้อความ) | ✅ | form + preview + PDF + Word |
| หนังสือประทับตรา | ✅ | form + preview + PDF + Word |
| คำสั่ง | ✅ | แบบที่ 4 |
| ประกาศ | ✅ | แบบที่ 7 · รองรับแจ้งความ |
| หนังสือรับรอง | ✅ | แบบที่ 10 · กรอบรูปว่าง |
| รายงานการประชุม | ✅ | แบบที่ 11 · กรอบโลโกว่าง ไม่มีครุฑ |
| จุดสร้าง `/documents/new` | ✅ | เลือกประเภทก่อนสร้าง |
| Onboarding แดชบอร์ดว่าง | ✅ | เทมเพลต → สร้าง → ส่งออก |
| DRAFT / FINAL + autosave | ✅ | ~20 วินาที |
| ประวัติ + ค้นหา + คัดลอก + ลบ | ✅ | |
| เทมเพลตหน่วยงาน | ✅ | `OrgTemplate` |
| Feature gate ตามแผน | ✅ | `entitlements.ts` |
| Pricing + Stripe API | ✅ โครง | เปิดขายเมื่อตั้ง env |
| ระเบียบ / ข้อบังคับ / แถลงการณ์ / ข่าว | ⏳ | “เร็วๆ นี้” ใน UI |
| DocumentVersion / e-Sign / SSO | ❌ | นอกขอบเขตตอนนี้ |

### บัญชีทดลอง

```bash
npm run db:seed
# หรือ: node scripts/seed-demo.js
# อีเมล: demo@easykrut.local
# รหัสผ่าน: demo1234
```

รัน: `npm run dev` → [http://localhost:3010](http://localhost:3010)

---

## 3. Userflow รวม

### 3.1 ผู้ใช้ใหม่

```mermaid
flowchart LR
  Landing[หน้าแรก /] --> Register[สมัคร /register]
  Register --> Dashboard[แดชบอร์ด]
  Dashboard --> Template[ตั้งเทมเพลต /org/settings]
  Dashboard --> NewDoc[เลือกประเภท /documents/new]
  NewDoc --> Editor[แก้ไข /documents/id]
  Editor --> Export[บันทึก / PDF / Word]
```

### 3.2 จุดเข้า UI

| จุด | เส้นทาง |
|-----|---------|
| หน้าแรก | `/` |
| แดชบอร์ด | `/dashboard` |
| เลือกประเภท | `/documents/new` |
| ประวัติ | `/documents` |
| แก้ไข / พิมพ์ | `/documents/[id]` · `/documents/[id]/print` |
| หน่วยงาน | `/org/settings` |
| ราคา | `/pricing` |
| เชิญ | `/invite/[token]` |

รายละเอียด: [`USERFLOW.md`](USERFLOW.md)

---

## 4. ประเภทเอกสาร

| ลำดับ | ประเภท | สถานะ | ชนิดในระบบ |
|-------|--------|--------|------------|
| 1 | หนังสือภายนอก | ✅ | `EXTERNAL` |
| 2 | หนังสือภายใน (บันทึกข้อความ) | ✅ | `INTERNAL` |
| 3 | หนังสือประทับตรา | ✅ | `STAMP` |
| 4 | หนังสือสั่งการ (คำสั่ง) | ✅ | `ORDER` |
| 5 | ประกาศ | ✅ | `ANNOUNCE` |
| 6 | หนังสือรับรอง | ✅ | `CERT` · แบบที่ 10 |
| 7 | รายงานการประชุม | ✅ | `MEETING` · แบบที่ 11 · ไม่มีครุฑ |

**รายงานการประชุม** ไม่ใส่ตราครุฑ — เว้นกรอบโลโก้ว่างด้านบน (อัปโหลดโลโก้องค์กรทีหลัง)

เลื่อน: ระเบียบ (แบบที่ 5) · ข้อบังคับ (6) · แถลงการณ์ (8) · ข่าว (9)

หัวข้อที่ล็อกในรายงานการประชุม:

| # | หัวข้อ | หมายเหตุการใช้คำ |
|---|--------|------------------|
| 1 | รายงานการประชุม | ชื่อคณะหรือชื่อการประชุม |
| 2 | ครั้งที่ | รายปี เช่น 1/2569 |
| 3 | เมื่อ | วัน เดือน ปี พ.ศ. ที่ประชุม |
| 4 | ณ | สถานที่ประชุม |
| 5 | ผู้มาประชุม | ไม่ใช้ “ผู้เข้าร่วมประชุม” สำหรับกรรมการ |
| 6 | ผู้ไม่มาประชุม | ถ้ามี + เหตุผลได้ |
| 7 | ผู้เข้าร่วมประชุม | ผู้ที่ไม่ได้เป็นคณะ (ถ้ามี) |
| 8 | เริ่มประชุมเวลา | ไม่ใช้ “เปิดประชุม” · เวลา 2 หลัก |
| 9 | ข้อความ | วาระ + มติ/ข้อสรุป |
| 10 | เลิกประชุมเวลา | ไม่ใช้ “ปิดประชุม” |
| 11 | ผู้จดรายงานการประชุม | ไม่ใช้ “ผู้บันทึก” |

ไฟล์ตัวอย่าง `docs/ขอเชิญเข้าร่วมการประชุม….docx` เป็น**หนังสือภายนอกเชิญประชุม** ไม่ใช่รายงานการประชุม

---

## 5. แผนราคาและลิมิต

| แผน | ที่นั่ง | เอกสาร/เดือน | PDF | Word | บาท/เดือน |
|-----|--------|--------------|-----|------|-----------|
| Free | 3 | 20 | ใช่ | ใช่ | 0 |
| Pro | 15 | 200 | ใช่ | ใช่ | 990 |
| Business | 50 | 99999 | ใช่ | ใช่ | 2,990 |

Stripe routes: `/api/stripe/checkout` · `/portal` · `/webhook`  
Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`

---

## 6. สถาปัตยกรรมสั้นๆ

```mermaid
flowchart TB
  subgraph client [Next.js Client]
    Editor[Editors]
    History[Documents]
    OrgUI[Org Settings]
  end
  subgraph server [Next.js Server]
    Auth[Auth.js]
    Actions[Server Actions]
    Gates[Entitlements]
    Export[PDF_DOCX]
    StripeAPI[Stripe]
  end
  subgraph data [SQLite or Postgres]
    Orgs[Organization]
    Docs[Document]
    Usage[UsageMeter]
  end
  Editor --> Actions
  History --> Actions
  OrgUI --> Actions
  Actions --> Gates
  Gates --> Docs
  Export --> Docs
  StripeAPI --> Orgs
  Auth --> Orgs
```

| ชั้น | ของจริงในโปรเจกต์ |
|------|-------------------|
| App | Next.js 16 App Router + TypeScript |
| UI CSS | `globals.css` utilities (ไม่ใช้ Tailwind package) |
| Auth | Auth.js v5 + Prisma adapter |
| DB | Prisma 5 + SQLite local · Postgres optional via Docker |
| Form | React state ใน editor (ไม่ใช่ react-hook-form) |
| PDF | `@react-pdf/renderer` + TH Sarabun ใน `public/fonts` |
| Word | `docx` |
| Billing | Stripe SDK |

โมเดลหลัก: User · Organization · Membership · Invitation · Document · OrgTemplate · UsageMeter

---

## 7. โครงโฟลเดอร์สำคัญ

```text
src/app/(app)/dashboard|documents|documents/new|documents/[id]|org/settings
src/app/api/export/{pdf,docx} + api/stripe/{checkout,portal,webhook}
src/components/editor|documents|billing
src/lib/actions|documents/{external,internal,stamp}|entitlements|auth|db|stripe
docs/OVERVIEW.md | PLAN.md | USERFLOW.md
prisma/schema.prisma
```

รายละเอียดเต็ม: [`PLAN.md` §4](PLAN.md)

---

## 8. Changelog

| เวอร์ชัน | วันที่ | สิ่งที่รวม |
|---------|--------|-----------|
| 1.0 | 9 ส.ค. 2026 | เอกสารรวม + userflow |
| 1.1 | 9 ส.ค. 2026 | บันทึกข้อความครบ · ล็อกชิ้นถัดไปประทับตรา |
| 1.2 | 9 ส.ค. 2026 | หมวดปัญหาที่เจอ |
| 1.3 | 9 ส.ค. 2026 | **จัดแผนทั้งหมดให้ตรงโค้ด** (สแต็ก, โฟลเดอร์, เฟส, acceptance) |
| 1.4 | 14 ส.ค. 2026 | **หนังสือประทับตราครบ** · ชิ้นถัดไปสั่งการ |
| 1.5 | 14 ส.ค. 2026 | เส้นคั่นบันทึกข้อความ · **แก้เอกสารรายงานการประชุม** (แบบที่ 11 แยก CERT) |
| 1.6 | 14 ส.ค. 2026 | **คำสั่ง ประกาศ รับรอง รายงานการประชุม** ครบวงจร · เปิดใน `/documents/new` |

---

## 9. ปัญหาที่เจอ (Known issues)

### 9.1 ผลิตภัณฑ์ / UX

| ปัญหา | สถานะ |
|--------|--------|
| จุดสร้างเอกสารเคยกระจาย / แดชบอร์ดสร้างได้แค่ภายนอก | ✅ แก้ด้วย `/documents/new` |
| Landing/README พูดแค่ภายนอก | ✅ แก้แล้ว |
| OVERVIEW อยู่บน PR draft ยังไม่ขึ้น branch หลัก | ✅ merge แล้ว |
| แผนใน docs เรียกรวมรับรอง+ประชุม และใช้ชื่อ “รายงานประชุม” | ✅ แยกแบบที่ 10/11 · ใช้ “รายงานการประชุม” |

### 9.2 เทคนิค

| ปัญหา | สถานะ |
|--------|--------|
| lint `useEffectEvent` ใน editor | ⏳ debt |
| seed ใช้ `require()` | ⏳ debt |
| `middleware` deprecated → `proxy` | ⏳ debt |
| PDF/Word ≠ HTML 100% | ยอมรับ MVP |
| Stripe ยังไม่ตั้ง env จริง | ⏳ Phase 6 |

### 9.3 กระบวนการ

| ปัญหา | แนวทาง |
|--------|--------|
| UI automation ล็อกอินพลาด ทำให้งานดูช้า | smoke ด้วย seed/curl ก่อน |
| `gh pr merge` ไม่ผ่านบางครั้ง | merge เข้า base ด้วย git ได้ |
| แผนใน docs ไม่ตรงโค้ด (โฟลเดอร์เก่า, MVP แค่ภายนอก, react-hook-form) | ✅ จัดรอบ v1.3 |

---

## 10. โรดแมป

| เฟส | สถานะ |
|------|--------|
| 0–4 Scaffold → UX/userflow | ✅ |
| 5 ประเภทเอกสาร | ✅ แบบ 1–4, 7, 10, 11 · **ถัดไประเบียบ/แถลงการณ์** |
| 6 Billing เปิดขาย | 🔄 โครงพร้อม |

### ชิ้นถัดไป

1. ระเบียบ (แบบที่ 5)  
2. ข้อบังคับ (แบบที่ 6)  
3. แถลงการณ์ (แบบที่ 8)  
4. ข่าว (แบบที่ 9) 

### Debt คู่ขนาน

- lint editor · middleware→proxy · seed eslint  


### นอกขอบเขตตอนนี้

ใบเสร็จ/ภาษี · e-Sign · SSO · เลขที่รันอัตโนมัติ · แชร์ลิงก์ · API สารบรรณ · White-label · แอปมือถือ · DocumentVersion  

---

## 11. Acceptance criteria

| # | เกณฑ์ | สถานะ |
|---|--------|--------|
| 1–8 | MVP เดิม (สมัคร, เชิญ, ภายนอก, บันทึก, export, ลิมิต, เร็วๆ นี้, userflow) | ✅ |
| 9 | หนังสือภายในครบวงจร | ✅ |
| 10 | หนังสือประทับตราครบวงจร | ✅ |
| 11 | คำสั่งครบวงจร | ✅ |
| 12 | ประกาศครบวงจร | ✅ |
| 13 | หนังสือรับรองครบวงจร | ✅ |
| 14 | รายงานการประชุมครบวงจร | ✅ |

---

## 12. ความเสี่ยงหลัก

| ความเสี่ยง | แนวทาง |
|------------|--------|
| Word ≠ HTML | เน้น PDF |
| รั่วข้าม org | `organizationId` + membership |
| Scope บวม | ทีละประเภท · ล็อกสั่งการ |
| แผนไม่ตรงของจริง | อัปเดต PLAN/OVERVIEW คู่ release |

---

## 13. เอกสารอ้างอิง

| ไฟล์ | เนื้อหา |
|------|---------|
| [`OVERVIEW.md`](OVERVIEW.md) | เอกสารรวมฉบับนี้ |
| [`PLAN.md`](PLAN.md) | แผนดำเนินการละเอียด (ตรงโค้ด) |
| [`USERFLOW.md`](USERFLOW.md) | เส้นทางผู้ใช้ |
| [`../README.md`](../README.md) | ติดตั้ง / รัน |
| คู่มือ PDF ใน `docs/` | รูปแบบหนังสือราชการ |
| `ขอเชิญเข้าร่วมการประชุม….docx` | ตัวอย่างหนังสือภายนอก (เชิญประชุม) — **ไม่ใช่**รายงานการประชุม |
| `krut-3-cm.png` | ต้นทางตราครุฑ → `public/krut.png` |
