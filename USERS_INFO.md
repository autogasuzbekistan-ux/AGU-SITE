# Auto Gas Uzbekistan - Foydalanuvchilar Ro'yxati

## 📋 Barcha Foydalanuvchilar va Parollar

### 👑 OWNER (Egalar) - 2 ta

| Ism | Email | Telefon | Parol | Role |
|-----|-------|---------|-------|------|
| Asosiy Owner | owner1@autogas.uz | +998901111111 | **owner123** | owner |
| Ikkinchi Owner | owner2@autogas.uz | +998901111112 | **owner123** | owner |

**Login sahifa:** `/autogas-admin-panel/owner/login.html`

---

### 👨‍💼 ADMIN (Adminlar) - 5 ta

| Ism | Email | Telefon | Parol | Role |
|-----|-------|---------|-------|------|
| Admin Toshkent | admin1@autogas.uz | +998901112221 | **admin123** | admin |
| Admin Samarqand | admin2@autogas.uz | +998901112222 | **admin123** | admin |
| Admin Buxoro | admin3@autogas.uz | +998901112223 | **admin123** | admin |
| Admin Farg'ona | admin4@autogas.uz | +998901112224 | **admin123** | admin |
| Admin Andijon | admin5@autogas.uz | +998901112225 | **admin123** | admin |

**Login sahifa:** `/autogas-admin-panel/admin/login.html`

---

### 🏪 KONTRAGENT (Magazinlar) - 12 ta

| Viloyat | Email | Telefon | Parol | Role | Region |
|---------|-------|---------|-------|------|--------|
| Toshkent Magazin | tas@magazin.uz | +998902000001 | **magazin123** | kontragent | Toshkent |
| Samarqand Magazin | sam@magazin.uz | +998902000002 | **magazin123** | kontragent | Samarqand |
| Buxoro Magazin | bux@magazin.uz | +998902000003 | **magazin123** | kontragent | Buxoro |
| Andijon Magazin | and@magazin.uz | +998902000004 | **magazin123** | kontragent | Andijon |
| Farg'ona Magazin | far@magazin.uz | +998902000005 | **magazin123** | kontragent | Farg'ona |
| Namangan Magazin | nam@magazin.uz | +998902000006 | **magazin123** | kontragent | Namangan |
| Qashqadaryo Magazin | qas@magazin.uz | +998902000007 | **magazin123** | kontragent | Qashqadaryo |
| Surxondaryo Magazin | sur@magazin.uz | +998902000008 | **magazin123** | kontragent | Surxondaryo |
| Jizzax Magazin | jiz@magazin.uz | +998902000009 | **magazin123** | kontragent | Jizzax |
| Sirdaryo Magazin | sir@magazin.uz | +998902000010 | **magazin123** | kontragent | Sirdaryo |
| Xorazm Magazin | xor@magazin.uz | +998902000011 | **magazin123** | kontragent | Xorazm |
| Navoiy Magazin | nav@magazin.uz | +998902000012 | **magazin123** | kontragent | Navoiy |

**Login sahifa:** `/autogas-seller-panel/login.html`

---

## 🔐 Parollar Xulasasi:

- **Owner parol:** `owner123`
- **Admin parol:** `admin123`
- **Kontragent parol:** `magazin123`

---

## 📊 Jami:

- **2** ta Owner
- **5** ta Admin
- **12** ta Kontragent
- **19** ta jami foydalanuvchi

---

## 🔍 Database'dan ko'rish uchun:

### SQL bilan:
```sql
SELECT id, name, email, phone, role, region, is_active
FROM users
ORDER BY
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'kontragent' THEN 3
    ELSE 4
  END,
  id;
```

### Laravel Tinker bilan:
```php
php artisan tinker

// Barcha foydalanuvchilar
User::all(['id', 'name', 'email', 'phone', 'role', 'region'])->toArray();

// Role bo'yicha
User::where('role', 'owner')->get(['name', 'email', 'phone']);
User::where('role', 'admin')->get(['name', 'email', 'phone']);
User::where('role', 'kontragent')->get(['name', 'email', 'phone', 'region']);
```

---

**Eslatma:** Database'dagi parollar bcrypt bilan hash qilingan, shuning uchun to'g'ridan-to'g'ri ko'rinmaydi. Yuqoridagi jadvalda ko'rsatilgan parollar (owner123, admin123, magazin123) - bu asl parollar.
