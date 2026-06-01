<?php
/**
 * USER_AWARD_BADGES.php
 * Awards badges to users based on criteria
 * Called during login to check and award eligible badges
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php'; // Your Cloudant config

// Get JWT token from Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided']);
    exit;
}

$token = $matches[1];

// Verify JWT and get user data
try {
    $payload = verifyJWT($token);
    $username = $payload->username;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

// Fetch user from Cloudant
$userDoc = getUserFromCloudant($username);

if (!$userDoc) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

// Initialize badges array if it doesn't exist
if (!isset($userDoc['badges'])) {
    $userDoc['badges'] = [];
}

$badgesAwarded = [];
$updated = false;

// Check for Founding Member badge
$foundingMemberCutoff = '2026-06-10T00:00:00Z';
$registeredAt = $userDoc['registered_at'] ?? null;

if ($registeredAt && strtotime($registeredAt) < strtotime($foundingMemberCutoff)) {
    // Check if user already has the badge
    $hasFoundingMember = false;
    foreach ($userDoc['badges'] as $badge) {
        if ($badge['id'] === 'founding-member') {
            $hasFoundingMember = true;
            break;
        }
    }
    
    if (!$hasFoundingMember) {
        // Award the badge
        $newBadge = [
            'id' => 'founding-member',
            'earned_at' => date('c') // ISO 8601 format
        ];
        $userDoc['badges'][] = $newBadge;
        $badgesAwarded[] = $newBadge;
        $updated = true;
    }
}

// Update user document in Cloudant if badges were awarded
if ($updated) {
    $updateResult = updateUserInCloudant($userDoc);
    
    if (!$updateResult) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update user badges']);
        exit;
    }
}

// Return awarded badges
echo json_encode([
    'success' => true,
    'badges_awarded' => $badgesAwarded,
    'total_badges' => count($userDoc['badges'])
]);

// Helper functions
function verifyJWT($token) {
    // Your JWT verification logic
    // This should match your existing JWT implementation
    $secret = getenv('JWT_SECRET') ?: 'your-secret-key';
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new Exception('Invalid token format');
    }
    
    list($header, $payload, $signature) = $parts;
    
    // Verify signature
    $validSignature = hash_hmac('sha256', "$header.$payload", $secret, true);
    $validSignature = base64_encode($validSignature);
    $validSignature = str_replace(['+', '/', '='], ['-', '_', ''], $validSignature);
    
    if ($signature !== $validSignature) {
        throw new Exception('Invalid signature');
    }
    
    $payloadData = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)));
    
    // Check expiration
    if (isset($payloadData->exp) && $payloadData->exp < time()) {
        throw new Exception('Token expired');
    }
    
    return $payloadData;
}

function getUserFromCloudant($username) {
    // Your Cloudant connection logic
    $cloudantUrl = getenv('CLOUDANT_URL');
    $cloudantDb = getenv('CLOUDANT_DB') ?: 'pedalplex_users';
    
    $docId = 'user_' . $username;
    $url = "$cloudantUrl/$cloudantDb/$docId";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    }
    
    return null;
}

function updateUserInCloudant($userDoc) {
    $cloudantUrl = getenv('CLOUDANT_URL');
    $cloudantDb = getenv('CLOUDANT_DB') ?: 'pedalplex_users';
    
    $docId = $userDoc['_id'];
    $url = "$cloudantUrl/$cloudantDb/$docId";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($userDoc));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ($httpCode === 200 || $httpCode === 201);
}
?>

// Made with Bob
