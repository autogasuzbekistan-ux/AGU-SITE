<?php
/**
 * Auto Gas Uzbekistan - Foydalanuvchilarni ko'rish
 *
 * Ishlatish:
 * php view_users.php
 */

// Database connection
$host = '127.0.0.1';
$db = 'autogas_marketplace';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "\n╔══════════════════════════════════════════════════════════════════════════╗\n";
    echo "║           AUTO GAS UZBEKISTAN - FOYDALANUVCHILAR RO'YXATI              ║\n";
    echo "╚══════════════════════════════════════════════════════════════════════════╝\n\n";

    // Get all users
    $stmt = $pdo->query("
        SELECT id, name, email, phone, role, region, is_active
        FROM users
        ORDER BY
          CASE role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'kontragent' THEN 3
            ELSE 4
          END,
          id
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get counts by role
    $stmt = $pdo->query("
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
        ORDER BY
          CASE role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'kontragent' THEN 3
            ELSE 4
          END
    ");
    $roleCounts = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // Display statistics
    echo "📊 STATISTIKA:\n";
    echo "├─ Owner: " . ($roleCounts['owner'] ?? 0) . " ta\n";
    echo "├─ Admin: " . ($roleCounts['admin'] ?? 0) . " ta\n";
    echo "├─ Kontragent: " . ($roleCounts['kontragent'] ?? 0) . " ta\n";
    echo "└─ Jami: " . count($users) . " ta\n\n";

    echo "🔐 PAROLLAR:\n";
    echo "├─ Owner parol: owner123\n";
    echo "├─ Admin parol: admin123\n";
    echo "└─ Kontragent parol: magazin123\n\n";

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    // Group by role
    $currentRole = '';
    foreach ($users as $user) {
        if ($currentRole !== $user['role']) {
            $currentRole = $user['role'];
            $roleTitle = strtoupper($currentRole);
            echo "\n🔷 {$roleTitle}\n";
            echo str_repeat("─", 78) . "\n";
        }

        $status = $user['is_active'] ? '✅' : '❌';
        $region = $user['region'] ? " ({$user['region']})" : '';

        echo sprintf(
            "%s ID:%2d │ %-25s │ %-25s │ %s%s\n",
            $status,
            $user['id'],
            $user['name'],
            $user['email'],
            $user['phone'],
            $region
        );
    }

    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "\n✅ Jami {$stmt->rowCount()} ta foydalanuvchi topildi.\n\n";

    // Display detailed info
    echo "📋 BATAFSIL MA'LUMOT:\n\n";

    $roleGroups = ['owner' => [], 'admin' => [], 'kontragent' => []];
    foreach ($users as $user) {
        if (isset($roleGroups[$user['role']])) {
            $roleGroups[$user['role']][] = $user;
        }
    }

    // Owners
    if (!empty($roleGroups['owner'])) {
        echo "👑 OWNER (Egalar):\n";
        foreach ($roleGroups['owner'] as $owner) {
            echo "   • {$owner['name']}\n";
            echo "     Email: {$owner['email']}\n";
            echo "     Telefon: {$owner['phone']}\n";
            echo "     Parol: owner123\n";
            echo "     Login: /autogas-admin-panel/owner/login.html\n\n";
        }
    }

    // Admins
    if (!empty($roleGroups['admin'])) {
        echo "👨‍💼 ADMIN (Adminlar):\n";
        foreach ($roleGroups['admin'] as $admin) {
            echo "   • {$admin['name']}\n";
            echo "     Email: {$admin['email']}\n";
            echo "     Telefon: {$admin['phone']}\n";
            echo "     Parol: admin123\n";
            echo "     Login: /autogas-admin-panel/admin/login.html\n\n";
        }
    }

    // Kontragents
    if (!empty($roleGroups['kontragent'])) {
        echo "🏪 KONTRAGENT (Magazinlar):\n";
        foreach ($roleGroups['kontragent'] as $kontragent) {
            $region = $kontragent['region'] ? " - {$kontragent['region']}" : '';
            echo "   • {$kontragent['name']}{$region}\n";
            echo "     Email: {$kontragent['email']}\n";
            echo "     Telefon: {$kontragent['phone']}\n";
            echo "     Parol: magazin123\n";
            echo "     Login: /autogas-seller-panel/login.html\n\n";
        }
    }

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

} catch (PDOException $e) {
    echo "\n❌ Database xatosi: " . $e->getMessage() . "\n\n";
    echo "Iltimos, database connection sozlamalarini tekshiring:\n";
    echo "  - Host: $host\n";
    echo "  - Database: $db\n";
    echo "  - User: $user\n\n";
}
