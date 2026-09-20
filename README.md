# ติดตั้ง TemperatureRecord: GitHub → Cloudflare → Google Sheets

คู่มือสำหรับผู้เริ่มต้นที่มีบัญชี GitHub แล้ว — 20 กันยายน 2026

ชุดนี้เป็นสำเนาที่ปรับสำหรับ Cloudflare Workers โดยตรง เว็บไซต์เดิมยังคงอยู่ ข้อมูลจริงยังเก็บใน Google Sheet เดิม ไม่ต้องสร้างชีทตามจำนวนตู้ รองรับ Frozen 24 ตู้และ Chill 13 ตู้ ตรวจทุก 2 ชั่วโมง ตั้งแต่ 07:00 ถึง 05:00 ของเช้าวันถัดไป

**แนะนำทำขั้นตอนอัปโหลดด้วยคอมพิวเตอร์** เพราะมีหลายโฟลเดอร์ หลังติดตั้งแล้วพนักงานเปิดเว็บและสแกน QR ด้วยมือถือได้ตามปกติ

## 1. แตกไฟล์และสร้าง Repository ใน GitHub

1. ดาวน์โหลด ZIP ที่ได้รับ แล้วเลือก Extract / แตกไฟล์ทั้งหมด
2. เปิดโฟลเดอร์ที่แตกแล้ว ต้องเห็น `package.json`, `wrangler.jsonc`, `vite.config.ts` และโฟลเดอร์ `app`, `lib`, `public`, `components`, `scripts`, `vendor`
3. ลงชื่อเข้า GitHub แล้วเปิด https://github.com/new
4. ช่อง Repository name ใส่ `temperature-record`
5. เลือก **Private**
6. ไม่ต้องเลือก Add README, .gitignore หรือ License เพราะในชุดไฟล์มีสิ่งที่จำเป็นแล้ว
7. กด **Create repository**
8. ใน Repository ใหม่ คลิก **uploading an existing file** ถ้ามีไฟล์อยู่แล้วใช้ **Add file → Upload files**
9. ลากไฟล์และโฟลเดอร์ **ข้างใน** โฟลเดอร์ที่แตกแล้วทั้งหมด ลงในช่องอัปโหลด ต้องรักษาโฟลเดอร์ย่อยไว้ ไม่ลากตัว ZIP และไม่ลากโฟลเดอร์ชั้นนอกครอบอีกชั้น
10. ช่องข้อความบันทึกใส่ `Initial temperature dashboard` แล้วกด **Commit changes** ให้เข้า branch `main`
11. กลับหน้า Repository: ต้องเห็น `package.json` และ `wrangler.jsonc` อยู่หน้าแรก ถ้าเห็นเพียงโฟลเดอร์ `TemperatureRecord_GitHub_Cloudflare` แปลว่าซ้อนโฟลเดอร์เกินไป ให้เปิดโฟลเดอร์นั้น เลือกไฟล์ภายใน และอัปโหลดใหม่ให้ถูกระดับ

ไม่ต้องเปิด GitHub Pages สำหรับชุดนี้ GitHub จะเก็บโค้ด ส่วน Cloudflare จะเปิดให้ใช้งานเป็นเว็บ

## 2. เชื่อม Google Sheets ด้วย Apps Script

1. เปิดไฟล์ TemperatureRecord ด้วยบัญชี Google ที่แก้ไขไฟล์นี้ได้:
   https://docs.google.com/spreadsheets/d/1pv8M0JS6VMIX__p7I5vv7x4-8OYX6mhBE7XUFx_1TQQ/edit
2. เลือก **ส่วนขยาย (Extensions) → Apps Script**
3. ตั้งชื่อโปรเจกต์เป็น `TemperatureRecord`
4. ใน GitHub เปิด `public/Code.gs` → กด **Raw** แล้วคัดลอกเนื้อหาทั้งหมด หรือเปิดไฟล์ `public/Code.gs` ที่แตกไว้ด้วยโปรแกรมแก้ไขข้อความ
5. วางในไฟล์ `Code.gs` ของ Apps Script แทนโค้ดตัวอย่าง หากมีโค้ดระบบอื่นอยู่ ให้เก็บสำเนาไว้ก่อน ไม่ลบโค้ดของระบบอื่น
6. กด **Save**
7. บนแถบเลือกฟังก์ชันด้านบน เลือก `prepareConnection` แล้วกด **Run / เรียกใช้**
8. เมื่อ Google ขออนุญาต ให้เลือกบัญชีเจ้าของชีทและอนุญาตให้โปรเจกต์ที่เพิ่งสร้างเข้าถึงชีท หากองค์กรปิดกั้นสิทธิ์หรือไม่มีตัวเลือกที่ต้องใช้ ให้ผู้ดูแล Google Workspace ช่วยตั้งค่า ไม่เปลี่ยนชีทเป็นสาธารณะเพื่อแก้ปัญหา
9. รอให้ทำงานเสร็จ ฟังก์ชันนี้ตรวจชื่อชีทและสร้างรหัสลับให้ ไม่เพิ่มรายการอุณหภูมิ
10. กดเฟือง **Project Settings / การตั้งค่าโปรเจกต์** → เลื่อนลง **Script Properties / พร็อพเพอร์ตี้ของสคริปต์**
11. จะมีชื่อ `TEMPERATURE_API_KEY` คัดลอก **ค่า** ของมันเก็บไว้ใช้ในขั้นตอน 4 ไม่ต้องส่งรหัสนี้ให้ผมหรือใส่ใน GitHub
12. กด **Deploy / ทำให้ใช้งานได้ → New deployment / การทำให้ใช้งานได้รายการใหม่**
13. เลือกประเภท **Web app / เว็บแอป**
14. **Execute as / ดำเนินการในนาม** เลือก **Me / ฉัน**
15. **Who has access / ผู้ที่มีสิทธิ์เข้าถึง** เลือก **Anyone / ทุกคน** ที่ไม่ต้องลงชื่อเข้า Google เพื่อให้เซิร์ฟเวอร์ Cloudflare ติดต่อได้ โค้ดตรวจรหัสลับทุกคำขออยู่แล้ว และไม่ต้องเปิดไฟล์ Google Sheet ให้ทุกคนดู
16. กด **Deploy** และทำขั้นตอนอนุญาตที่ Google แสดง
17. คัดลอก **Web app URL** ที่ลงท้าย `/exec` เก็บไว้ ใช้ในขั้นตอน 4

อย่ากด Run ที่ `doPost` เพราะฟังก์ชันนั้นต้องรับคำขอจากเว็บ การเปิด `/exec` ตรง ๆ อาจขึ้นว่าไม่พบ `doGet` ซึ่งไม่ใช่วิธีทดสอบระบบนี้ ให้ทดสอบผ่านแดชบอร์ดในขั้นตอน 5

## 3. นำ Repository ไปเปิดเป็นเว็บบน Cloudflare

1. เปิด https://dash.cloudflare.com/ แล้วลงชื่อเข้าใช้ หากยังไม่มีบัญชี ให้สมัครด้วยอีเมลของคุณก่อน ไม่จำเป็นต้องย้ายโดเมนหรือซื้อโดเมนเพื่อใช้ URL `workers.dev`
2. เข้าเมนู **Workers & Pages**
3. กด **Create application** แล้วเลือก **Import a repository / Get started**
4. เลือก **GitHub** แล้วอนุญาตให้ Cloudflare เข้าถึงเฉพาะ Repository `temperature-record` ถ้ามีตัวเลือก Only select repositories
5. เลือก Repository `temperature-record`
6. ตั้งค่าตามตารางนี้:

| ช่อง | ค่าที่ใส่ |
|---|---|
| Worker / Project name | `temperature-record` |
| Production branch | `main` |
| Root directory | เว้นว่าง หรือ `/` |
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` |

ชื่อ Worker ต้องตรงกับ `name` ใน `wrangler.jsonc` ซึ่งชุดนี้ตั้งเป็น `temperature-record` ถ้ามี Worker ชื่อนี้อยู่แล้ว ต้องเลือกชื่ออื่นและแก้ `name` ในไฟล์ให้ตรงกันก่อนเผยแพร่

7. กด **Save and Deploy** แล้วรอให้ขั้นตอนติดตั้ง สร้าง และเผยแพร่สำเร็จ
8. บันทึก URL ที่ Cloudflare แสดง เช่น `https://temperature-record.<บัญชีของคุณ>.workers.dev`
9. ถ้าเปิดเว็บตอนนี้แล้วแจ้งให้ตั้ง `WEB_USERNAME` / `WEB_PASSWORD` ถือว่าเป็นขั้นตอนปกติ ให้ทำขั้นตอน 4 ต่อ

`package.json` กำหนดรุ่น pnpm ไว้แล้ว หากหน้าตั้งค่ามีช่อง Node.js version ให้ใช้ 22.13 ขึ้นไป การติดตั้งแพ็กเกจใช้ `pnpm-lock.yaml` ที่ให้มา ไม่ต้องอัปโหลด `node_modules`

## 4. ใส่ค่าการเชื่อมต่อและรหัสผ่านเว็บ

1. ใน Cloudflare เปิด Worker `temperature-record`
2. เลือก **Settings → Variables and Secrets → Add**
3. เลือกชนิด **Secret** แล้วเพิ่ม 4 รายการนี้:

| Variable name | Value |
|---|---|
| `GAS_ENDPOINT` | Web app URL ลงท้าย `/exec` ที่ได้จาก Apps Script |
| `GAS_API_KEY` | ค่าเดียวกับ `TEMPERATURE_API_KEY` ใน Script Properties |
| `WEB_USERNAME` | ชื่อผู้ใช้เข้าเว็บที่คุณตั้งเอง ใช้อังกฤษหรือตัวเลขและไม่มีเครื่องหมาย `:` |
| `WEB_PASSWORD` | รหัสผ่านเข้าเว็บที่คุณตั้งเอง อย่างน้อย 12 ตัวอักษร ใช้คนละค่ากับ API key |

4. กด **Deploy** เพื่อใช้ค่าใหม่
5. เปิด URL Cloudflare อีกครั้ง เบราว์เซอร์จะถามชื่อผู้ใช้และรหัสผ่าน ให้ใส่ `WEB_USERNAME` และ `WEB_PASSWORD` ที่ตั้งไว้

ใส่ค่าที่ **Settings → Variables and Secrets** ของ Worker ไม่ใช่ Build variables ไม่ต้องฝังค่าลงในไฟล์โค้ด และไม่ต้องใส่เครื่องหมายคำพูดครอบค่าที่กรอก

รหัสเข้าเว็บเป็นรหัสร่วมที่เจ้าของแจกให้ทีม ส่วนชื่อผู้บันทึกยังกรอกในฟอร์มรายคน ไม่ใช่ระบบยืนยันตัวตนพนักงานรายบุคคล หากจะเปลี่ยนเป็นบัญชีพนักงานแต่ละคนต้องเพิ่มระบบนั้นภายหลัง

## 5. ทดลองใช้งานก่อนพิมพ์ QR

1. หน้าเว็บควรแสดง **เชื่อมต่อ Google Sheets** อย่าเข้าโหมดทดลองถ้าต้องการตรวจการเขียนข้อมูลจริง
2. เปิดแท็บ **บันทึก** เลือกตู้จริงหนึ่งตู้ อ่านอุณหภูมิจริง ใส่ชื่อผู้บันทึก และหมายเหตุ `ทดสอบระบบครั้งแรก`
3. กดบันทึกหนึ่งครั้ง รอข้อความยืนยันสำเร็จ
4. เปิดชีท **บันทึกอุณหภูมิ** ตรวจว่ามีรายการเพิ่ม รหัสตู้ อุณหภูมิ ชื่อผู้บันทึกและเวลาตรงกัน
5. กลับแท็บ **ภาพรวม** กดอัปเดต ตรวจค่าของตู้และรอบนั้น
6. เปิด **รายตู้ & QR** จาก URL Cloudflare ใหม่นี้ ทดลองสแกน QR หนึ่งตู้ด้วยมือถือ ต้องเปิดฟอร์มและล็อกรหัสตู้ถูกต้อง
7. เมื่อทดสอบผ่านแล้วจึงพิมพ์ QR ทั้ง 37 ตู้จากเว็บใหม่ QR เดิมยังพาไป URL เดิม

## เกณฑ์ที่เตรียมไว้

| ประเภท | ปกติ °C | เฝ้าระวัง °C | ผิดปกติ °C | วิกฤต °C |
|---|---|---|---|---|
| Frozen | ≤ −20 | > −20 ถึง ≤ −15 | > −15 ถึง < −10 | ≥ −10 |
| เดลิกา / เนื้อสัตว์ | ≤ 2 | — | > 2 ถึง ≤ 10 | > 10 |
| นม / ชีส | ≤ 4 | — | > 4 | ยังไม่กำหนด |
| ผัก / ผลไม้ | ≤ 8 | — | > 8 | ยังไม่กำหนด |

Chill ทั้ง 13 ตู้ยังรอกำหนดสินค้า เมื่อทราบแล้วเลือกประเภทในคอลัมน์ F ของชีท **ทะเบียนตู้** เกณฑ์ปกติคอลัมน์ E จะคำนวณให้ ประวัติเดิมเก็บสถานะตามเกณฑ์ ณ ตอนบันทึก

ยังไม่ได้กำหนดช่วงผ่อนผันตรงเวลา/สาย ปัจจุบันจะแสดงขาดบันทึกเมื่อจบรอบ 2 ชั่วโมงแล้วยังไม่มีข้อมูล

## ถ้าติดปัญหา

| อาการ | ตรวจจุดนี้ |
|---|---|
| Cloudflare หา `package.json` ไม่เจอ | อัปโหลดโฟลเดอร์ซ้อนหรือ Root directory ผิด |
| ชื่อ Worker ไม่ตรง | `temperature-record` ต้องตรงกันใน Cloudflare และ `wrangler.jsonc` |
| เว็บแจ้งตั้ง WEB_USERNAME/WEB_PASSWORD | เพิ่ม Secrets ทั้งสอง รหัสผ่านอย่างน้อย 12 ตัวอักษร แล้วกด Deploy |
| เบราว์เซอร์ถามรหัสซ้ำ | ตรวจชื่อผู้ใช้และรหัสผ่านเข้าเว็บ ปิดแท็บส่วนตัวแล้วเปิดใหม่หากเคยจำรหัสเก่า |
| ยังไม่ได้เชื่อม Google Sheets | ตรวจ `GAS_ENDPOINT` และ `GAS_API_KEY` ใน Secrets ของ Worker |
| ไม่อนุญาตให้เข้าถึง | `GAS_API_KEY` ต้องตรงกับ `TEMPERATURE_API_KEY` ทุกตัวอักษร |
| ติดต่อ Google Sheets ไม่สำเร็จ | URL ต้องเป็น `/exec`; สิทธิ์ Apps Script ต้องให้เซิร์ฟเวอร์เข้าโดยไม่ต้องลงชื่อเข้า Googleได้ |
| หน้าเว็บมีข้อความโหมดทดลอง | ออกจากโหมดทดลองก่อนทดสอบบันทึกจริง |
| Apps Script แจ้งว่าไม่ได้ยืนยัน/องค์กรบล็อก | ตรวจว่าเป็นโปรเจกต์ที่สร้างเอง และให้ผู้ดูแลบัญชีช่วยเรื่องนโยบาย ห้ามส่งรหัสผ่านหรือ API key ในภาพหน้าจอ |

หากแก้ Code.gs ภายหลัง ให้ Save แล้วเลือก Deploy → Manage deployments → Edit → New version → Deploy จึงจะใช้โค้ดใหม่ ส่วนการแก้โค้ดเว็บใน GitHub จะกระตุ้น Cloudflare ให้สร้างเว็บใหม่ตามการเชื่อม Repository

## ขอบเขตการตรวจชุดไฟล์

ตรวจ TypeScript และสร้างเว็บสำหรับ Cloudflare ในเครื่องทดสอบแล้ว พร้อมทดสอบการป้องกันหน้าเว็บ/API ด้วยรหัสผ่าน ชุดไฟล์นี้ยังไม่ได้เผยแพร่ในบัญชี GitHub/Cloudflare ของคุณ และยังไม่ได้ทดสอบการเขียนเข้า Google Sheets จริง ต้องทำขั้นตอน 2–5 ให้ครบ

## เอกสารอ้างอิงทางการ

- [สร้าง Repository ใน GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [อัปโหลดไฟล์ผ่านหน้าเว็บ GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Cloudflare เชื่อม GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Cloudflare ตั้ง Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Google Apps Script Web app](https://developers.google.com/apps-script/guides/web)
- [Apps Script Properties](https://developers.google.com/apps-script/guides/properties)
