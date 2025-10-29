-- Auto Gas Uzbekistan - Foydalanuvchilarni ko'rish uchun SQL

-- 1. Barcha foydalanuvchilar (role bo'yicha tartiblangan)
SELECT
    id,
    name,
    email,
    phone,
    role,
    region,
    is_active,
    created_at
FROM users
ORDER BY
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'kontragent' THEN 3
    WHEN 'customer' THEN 4
    ELSE 5
  END,
  id;

-- 2. Faqat Owner'lar
SELECT id, name, email, phone, role FROM users WHERE role = 'owner';

-- 3. Faqat Admin'lar
SELECT id, name, email, phone, role FROM users WHERE role = 'admin';

-- 4. Faqat Kontragent'lar (viloyat bilan)
SELECT id, name, email, phone, region, role FROM users WHERE role = 'kontragent' ORDER BY region;

-- 5. Role bo'yicha statistika
SELECT
    role,
    COUNT(*) as count,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
FROM users
GROUP BY role
ORDER BY
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'kontragent' THEN 3
    ELSE 4
  END;

-- 6. Barcha foydalanuvchilar (JSON formatda chiroyli)
SELECT JSON_OBJECT(
    'id', id,
    'name', name,
    'email', email,
    'phone', phone,
    'role', role,
    'region', region,
    'is_active', is_active
) as user_data
FROM users
ORDER BY role, id;
