# Mahsulotlar Ko'rinmasligi Muammosini Aniqlash

## ❌ Muammo:
Seller panel orqali mahsulot qo'shildi, lekin umumiy saytda ko'rinmayapti.

## 🔍 Sabablari:

### **ASOSIY SABAB - Migration Bajarilmagan**

Backend kodida `status` va `is_active` ustunlari talab qilinadi, lekin database'da ular **YO'Q**!

```php
// ProductController.php - line 19
$query = Product::public();  // ← Bu status='approved' AND is_active=1 ni talab qiladi

// Product.php - scopePublic()
public function scopePublic($query)
{
    return $query->where('status', 'approved')->where('is_active', true);
}
```

Agar database'da `status` va `is_active` ustunlari bo'lmasa:
- ❌ SQL xatosi: "Unknown column 'status'"
- ❌ GET /api/products → xato qaytaradi yoki bo'sh array
- ❌ Umumiy saytda mahsulotlar ko'rinmaydi

---

## ✅ Yechim:

### **1. Database'da ustunlar bormi tekshiring:**

Database'ga kiring va bajaring:

```sql
DESCRIBE products;
```

Natijada `status` va `is_active` ko'rinishi kerak. Agar **YO'Q** bo'lsa, 2-qadamga o'ting.

---

### **2. Migration bajarish:**

**SQL faylni ishga tushiring:**

```bash
# Database'ga ulanish
mysql -u root -p autogas_marketplace

# Parolni kiriting (bo'sh bo'lsa Enter bosing)

# SQL bajarish
source /home/user/AGU/FIX_PRODUCTS_TABLE.sql

# Yoki to'g'ridan-to'g'ri:
```

```sql
ALTER TABLE `products`
ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'
    COMMENT 'Mahsulot holati' AFTER `quantity`,
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Mahsulot faol/faol emas' AFTER `status`;
```

---

### **3. Mavjud mahsulotlarga default qiymatlar berish:**

```sql
-- Barcha mavjud mahsulotlarni approved va active qilish
UPDATE products
SET status = 'approved', is_active = 1
WHERE status IS NULL OR is_active IS NULL;
```

---

### **4. Test qilish:**

#### **A. Browser Developer Tools orqali:**

1. Umumiy saytni oching (index.html)
2. F12 bosing → **Console** tab
3. Quyidagi kodni kiriting:

```javascript
fetch('http://127.0.0.1:8000/api/products')
  .then(r => r.json())
  .then(d => console.log('Products:', d))
  .catch(e => console.error('Error:', e));
```

**Natija ko'rish kerak:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Mahsulot nomi",
      "price": "100000.00",
      "status": "approved",
      "is_active": true,
      ...
    }
  ]
}
```

#### **B. Direct URL orqali:**

Browserda oching:
```
http://127.0.0.1:8000/api/products
```

Agar mahsulotlar ko'rinsa - hammasi ishlayapti!

---

### **5. Agar hali ko'rinmasa:**

#### **Seller panel orqali mahsulot qo'shganda:**

1. F12 → **Network** tab
2. Mahsulot qo'shing
3. `/kontragent/products` request'ni toping
4. **Response** tab'ini ko'ring

**Muvaffaqiyatli response:**
```json
{
  "success": true,
  "message": "Mahsulot muvaffaqiyatli yaratildi",
  "data": {
    "id": 123,
    "name": "...",
    "status": "approved",
    "is_active": true
  }
}
```

---

## 🆘 Qo'shimcha Tekshiruv:

### **Database'da mahsulotlar bormi?**

```sql
-- Oxirgi 10 ta mahsulot
SELECT id, name, price, status, is_active, created_at
FROM products
ORDER BY id DESC
LIMIT 10;

-- Jami mahsulotlar soni
SELECT COUNT(*) as total FROM products;

-- Status bo'yicha
SELECT status, COUNT(*) as count
FROM products
GROUP BY status;
```

---

## 📋 Xulosa:

1. ✅ **Migration bajaring** - FIX_PRODUCTS_TABLE.sql
2. ✅ **Mahsulotlarga default qiymat bering** - UPDATE products SET status='approved'
3. ✅ **Test qiling** - GET /api/products endpoint
4. ✅ **Umumiy saytni yangilang** - F5 bosing

---

## 🔧 Vaqtinchalik Yechim (Migration qila olmasangiz):

Agar migration bajarib bo'lmasa, ProductController'ni vaqtincha o'zgartiring:

**autogas-backend/app/Http/Controllers/Api/ProductController.php** - line 19:

O'zgartiring:
```php
// $query = Product::public();  // ← Vaqtincha comment
$query = Product::query();      // ← Barcha mahsulotlarni ko'rsatadi
```

**Eslatma:** Bu vaqtincha yechim! Asosiy yechim - migration bajarish!

---

Qaysi usuldan foydalanmoqchisiz? Database'ga kirishingiz mumkinmi?
