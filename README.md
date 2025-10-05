
# 💳 Zarinpal Charging App

سیستم مدیریت و پرداخت شارژ فروشگاه‌ها با اتصال به درگاه زرین‌پال.  
هر فروشگاه پنل خودش را دارد و می‌تواند ماه‌هایی که بدهکار است را مشاهده و پرداخت کند.

---

## ⚙️ ویژگی‌ها
- ثبت و مدیریت واحدها (فروشگاه‌ها)
- تعریف مبالغ ماهانه برای هر واحد
- انتخاب چند ماه جهت پرداخت
- پرداخت مستقیم از طریق **زرین‌پال**
- بروزرسانی خودکار وضعیت پرداخت پس از تأیید تراکنش
- سیستم احراز هویت JWT برای پنل ادمین و کاربران

---

## 🧱 ساختار پروژه

```

zarinpal-charging-app/
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   └── middleware/
│   ├── package.json
│   └── .env
│
└── frontend/
├── src/
├── package.json
└── ...

````

---

## 🚀 راه‌اندازی Backend

### 1️⃣ نصب وابستگی‌ها
```bash
cd backend
npm install
````

### 2️⃣ تنظیم متغیرهای محیطی (`.env`)

در مسیر `backend/` فایلی به نام `.env` بساز و مقادیر زیر را تنظیم کن:

```env
PORT=3009
MONGO_URI=mongodb://localhost:27017/zarinpal_charging
JWT_SECRET=your_jwt_secret
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
BASE_URL=http://localhost:3009
FRONTEND_URL=http://localhost:3000
```

> ⚠️ حتماً `ZARINPAL_MERCHANT_ID` را از [زرین‌پال](https://www.zarinpal.com) بگیر.

### 3️⃣ اجرای سرور

```bash
node src/server.js
```

اگر همه‌چیز درست باشد، خروجی مشابه زیر می‌بینی:

```
Server running on 3009
Mongo connected
```

---

## 💻 راه‌اندازی Frontend

### 1️⃣ نصب وابستگی‌ها

```bash
cd frontend
npm install
```

### 2️⃣ اجرای پروژه

```bash
npm start
```

در مرورگر برو به:

```
http://localhost:3000
```

---

## 🔗 تست API‌ها

با Postman یا curl می‌تونی تست بگیری:

### ثبت واحد جدید (Admin)

`POST /api/unites/create`

```json
{
  "name": "فروشگاه نادری"
}
```

### افزودن قبض برای واحد

`POST /api/bills/add`

```json
{
  "unitId": "ID_واحد",
  "month": "مهر 1403",
  "amount": 5000000
}
```

### شروع پرداخت

`POST /api/payment/start`

```json
{
  "totalToCharge": 45000000,
  "payments": [
    { "billingItemId": "6521...", "amount": 20000000 },
    { "billingItemId": "6522...", "amount": 25000000 }
  ]
}
```

---

## 🧰 تکنولوژی‌ها

* **Backend:** Node.js (Express)
* **Database:** MongoDB + Mongoose
* **Auth:** JWT
* **Payment Gateway:** Zarinpal Sandbox / Live
* **Frontend:** React + Material UI (MUI)
* **Deploy Ready:** GitHub + Render / Vercel / Railway

---

## 🧑‍💻 توسعه‌دهنده

**Amiryasin Azizi**
Programmer — Bandar Abbas Mall
📧 [amiryasinazizi2050@gmail.com]
🌐 [GitHub: IanAzizi](https://github.com/IanAzizi)

---

## 📜 مجوز

MIT License © 2025 Amiryasin Azizi 
(با لینک‌های واقعی پروژه‌ت و ایمیل اختیاری)
```
