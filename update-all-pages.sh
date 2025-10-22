#!/bin/bash

# AGU Branding va Navbar - Barcha sahifalarga qo'shish
echo "🚀 AGU Brending va Navbar - Barcha sahifalarga qo'shilmoqda..."

# Kontragent Panel HTML fayllar
KONTRAGENT_FILES=(
    "/home/user/AGU/autogas-seller-panel/dashboard.html"
    "/home/user/AGU/autogas-seller-panel/inventory.html"
    "/home/user/AGU/autogas-seller-panel/notifications.html"
    "/home/user/AGU/autogas-seller-panel/orders.html"
    "/home/user/AGU/autogas-seller-panel/products.html"
    "/home/user/AGU/autogas-seller-panel/shipments.html"
    "/home/user/AGU/autogas-seller-panel/track-shipment.html"
    "/home/user/AGU/autogas-seller-panel/transactions.html"
    "/home/user/AGU/autogas-seller-panel/transfers.html"
)

# Admin Panel HTML fayllar
ADMIN_FILES=(
    "/home/user/AGU/autogas-admin-panel/admin/dashboard.html"
    "/home/user/AGU/autogas-admin-panel/admin/inventory.html"
    "/home/user/AGU/autogas-admin-panel/admin/kontragents.html"
    "/home/user/AGU/autogas-admin-panel/admin/notifications.html"
    "/home/user/AGU/autogas-admin-panel/admin/orders.html"
    "/home/user/AGU/autogas-admin-panel/admin/products.html"
    "/home/user/AGU/autogas-admin-panel/admin/shipments.html"
    "/home/user/AGU/autogas-admin-panel/admin/transactions.html"
    "/home/user/AGU/autogas-admin-panel/admin/transfers.html"
    "/home/user/AGU/autogas-admin-panel/admin/warehouses.html"
)

echo "📦 Kontragent Panel sahifalari yangilanmoqda..."

for file in "${KONTRAGENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $(basename $file)"

        # AGU Branding scriptini qo'shish (agar yo'q bo'lsa)
        if ! grep -q "agu-branding.js" "$file"; then
            sed -i '/<title>/a\    <!-- AGU Branding -->\n    <script src="components/agu-branding.js"></script>' "$file"
        fi

        # AGU Navbar scriptini qo'shish (agar yo'q bo'lsa)
        if ! grep -q "agu-navbar.js" "$file"; then
            sed -i '/<title>/a\    <!-- AGU Navbar -->\n    <script src="components/agu-navbar.js"></script>' "$file"
        fi

        # FontAwesome qo'shish (agar yo'q bo'lsa)
        if ! grep -q "font-awesome" "$file"; then
            sed -i '/<\/head>/i\    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">' "$file"
        fi

        # Navbar placeholder qo'shish (agar yo'q bo'lsa)
        if ! grep -q "agu-navbar" "$file"; then
            sed -i '/<body[^>]*>/a\    <!-- AGU Navbar -->\n    <div id="agu-navbar"></div>' "$file"
        fi
    fi
done

echo ""
echo "🔧 Admin Panel sahifalari yangilanmoqda..."

for file in "${ADMIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $(basename $file)"

        # AGU Branding scriptini qo'shish (agar yo'q bo'lsa)
        if ! grep -q "agu-branding.js" "$file"; then
            sed -i '/<title>/a\    <!-- AGU Branding -->\n    <script src="../components/agu-branding.js"></script>' "$file"
        fi

        # AGU Admin Navbar scriptini qo'shish (agar yo'q bo'lsa)
        if ! grep -q "agu-navbar-admin.js" "$file"; then
            sed -i '/<title>/a\    <!-- AGU Admin Navbar -->\n    <script src="../components/agu-navbar-admin.js"></script>' "$file"
        fi

        # FontAwesome qo'shish (agar yo'q bo'lsa)
        if ! grep -q "font-awesome" "$file"; then
            sed -i '/<\/head>/i\    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">' "$file"
        fi

        # Navbar placeholder qo'shish (agar yo'q bo'lsa)
        if ! grep -q "agu-navbar" "$file"; then
            sed -i '/<body[^>]*>/a\    <!-- AGU Admin Navbar -->\n    <div id="agu-navbar"></div>' "$file"
        fi
    fi
done

echo ""
echo "✅ Barcha sahifalar yangilandi!"
echo "📊 Jami: $((${#KONTRAGENT_FILES[@]} + ${#ADMIN_FILES[@]})) sahifa"
echo ""
echo "🎨 AGU Brending, Logo, Ranglar va Animatsiyalar hammaga qo'shildi!"
