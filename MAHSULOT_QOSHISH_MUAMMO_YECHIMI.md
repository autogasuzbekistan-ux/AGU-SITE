# 🔧 Mahsulot Qo'shish Muammosini Hal Qilish

## ❌ Muammo:

Seller panel orqali mahsulot qo'shmoqchi bo'lsangiz xato chiqyapti, chunki database'da `status` va `is_active` ustunlari yo'q.

## ✅ Yechim:

SQL faylni bajaring: **`/home/user/AGU/FIX_PRODUCTS_TABLE.sql`**

---

## 📋 Bajaring (3 ta variant):

### **VARIANT 1 - Backend Server Ichida (SSH orqali)**

Agar backend serveringizga SSH bilan kirsangiz:

```bash
# Backend serverga kiring
ssh user@your-backend-server

# Database'ga ulanish
mysql -u root -p autogas_marketplace

# Parol so'ralsa, .env dagi DB_PASSWORD ni kiriting
# (bizning holatda bo'sh)

# SQL faylni bajarish
mysql> source /home/user/AGU/FIX_PRODUCTS_TABLE.sql;

# Yoki to'g'ridan-to'g'ri:
mysql> ALTER TABLE `products`
       ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' AFTER `quantity`,
       ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `status`;

# Chiqish
mysql> exit;
```

---

### **VARIANT 2 - phpMyAdmin orqali**

Agar phpMyAdmin bor bo'lsa:

1. **phpMyAdmin** ga kiring (odatda `http://localhost/phpmyadmin`)
2. Chap tarafdan **`autogas_marketplace`** database'ni tanlang
3. Yuqorida **SQL** tab'ini bosing
4. Quyidagi SQL kodni qo'ying va **Go** bosing:

```sql
ALTER TABLE `products`
ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'
    COMMENT 'Mahsulot holati' AFTER `quantity`,
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Mahsulot faol/faol emas' AFTER `status`;
```

---

### **VARIANT 3 - MySQL Workbench yoki DBeaver**

Agar MySQL Workbench yoki DBeaver ishlatayotgan bo'lsangiz:

1. Database connection yarating:
   - **Host:** 127.0.0.1 (yoki backend server IP)
   - **Port:** 3306
   - **Database:** autogas_marketplace
   - **User:** root
   - **Password:** (bo'sh yoki .env dagi parol)

2. SQL faylni oching: `/home/user/AGU/FIX_PRODUCTS_TABLE.sql`

3. **Execute** yoki **Run** bosing

---

## 🔍 Tekshirish:

SQL bajarilgandan keyin tekshiring:

```sql
DESCRIBE products;
```

Natijada `status` va `is_active` ustunlari ko'rinishi kerak:

```
+-------------+----------------------------------------+------+-----+-----------+
| Field       | Type                                   | Null | Key | Default   |
+-------------+----------------------------------------+------+-----+-----------+
| ...         | ...                                    | ...  | ... | ...       |
| quantity    | int                                    | NO   |     | 0         |
| status      | enum('pending','approved','rejected')  | NO   |     | approved  |
| is_active   | tinyint(1)                             | NO   |     | 1         |
| created_at  | timestamp                              | YES  |     | NULL      |
| updated_at  | timestamp                              | YES  |     | NULL      |
+-------------+----------------------------------------+------+-----+-----------+
```

---

## 🎉 Natija:

SQL bajarilgach:
- ✅ Seller panel orqali mahsulot qo'shish ishlaydi
- ✅ Yangi mahsulotlar avtomatik `approved` va `active` bo'ladi
- ✅ Umumiy saytda ko'rinadi

---

## 🆘 Yordam Kerakmi?

Agar yuqoridagi variantlardan hech biri ishlamasa:

1. Backend server qayerda ishlab turibdi? (localhost, Docker, cloud server?)
2. Database'ga qanday kirasiz? (phpMyAdmin, terminal, boshqa tool?)
3. Backend .env faylidagi database sozlamalari to'g'rimi?

Javob bering, ko'maklashamiz!
