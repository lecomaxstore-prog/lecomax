<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "message" => "Method not allowed"]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "message" => "Invalid JSON payload"]);
    exit;
}

function clean_text(string $value, int $max = 200): string {
    $value = trim($value);
    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value);
    if (mb_strlen($value) > $max) {
        $value = mb_substr($value, 0, $max);
    }
    return $value;
}

$honeypot = isset($data["website"]) ? clean_text((string)$data["website"], 80) : "";
if ($honeypot !== "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "message" => "Spam detected"]);
    exit;
}

$ip = $_SERVER["REMOTE_ADDR"] ?? "unknown";
$limitWindow = 600; // 10 minutes
$limitMax = 5; // max requests per window
$limitFile = sys_get_temp_dir() . "/order_rate_" . preg_replace('/[^a-zA-Z0-9_\-]/', "_", $ip) . ".json";

$rate = ["count" => 0, "start" => time()];
if (is_file($limitFile)) {
    $decoded = json_decode((string)file_get_contents($limitFile), true);
    if (is_array($decoded) && isset($decoded["count"], $decoded["start"])) {
        $rate = $decoded;
    }
}

$now = time();
if ($now - (int)$rate["start"] > $limitWindow) {
    $rate = ["count" => 0, "start" => $now];
}

if ((int)$rate["count"] >= $limitMax) {
    http_response_code(429);
    echo json_encode(["ok" => false, "message" => "Too many requests. Please try again later."]);
    exit;
}

$rate["count"] = (int)$rate["count"] + 1;
file_put_contents($limitFile, json_encode($rate));

$fullName = isset($data["fullName"]) ? clean_text((string)$data["fullName"], 120) : "";
$phone = isset($data["phone"]) ? clean_text((string)$data["phone"], 40) : "";
$address = isset($data["address"]) ? clean_text((string)$data["address"], 160) : "";
$city = isset($data["city"]) ? clean_text((string)$data["city"], 80) : "";
$postalCode = isset($data["postalCode"]) ? clean_text((string)$data["postalCode"], 20) : "";
$cartItems = isset($data["cartItems"]) && is_array($data["cartItems"]) ? $data["cartItems"] : [];
$total = isset($data["total"]) ? (float)$data["total"] : 0.0;

if ($fullName === "" || $phone === "" || $address === "" || $city === "" || $postalCode === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "message" => "Missing required fields"]);
    exit;
}

if (!preg_match('/^\+?\d[\d\s()\-]{7,}$/', $phone)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "message" => "Invalid phone number"]);
    exit;
}

if (!$cartItems || !is_array($cartItems)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "message" => "Cart is empty"]);
    exit;
}

$orderId = "LEC-" . date("Y") . "-" . random_int(1000, 9999);
$orderDate = date("Y-m-d H:i:s");

$rowsHtml = "";
foreach ($cartItems as $item) {
    if (!is_array($item)) continue;
    $title = clean_text((string)($item["title"] ?? $item["id"] ?? "Item"), 120);
    $qty = (int)($item["qty"] ?? 1);
    $price = (float)($item["price"] ?? 0);
    $color = clean_text((string)($item["color"] ?? ""), 40);
    $size = clean_text((string)($item["size"] ?? ""), 40);
    $meta = trim($color . ($color && $size ? " • " : "") . $size);
    $subtotal = $qty * $price;

    $rowsHtml .= "<tr>" .
        "<td style=\"padding:10px;border-bottom:1px solid #e5e7eb;\">" . htmlspecialchars($title) . "</td>" .
        "<td style=\"padding:10px;border-bottom:1px solid #e5e7eb;\">" . htmlspecialchars($meta !== "" ? $meta : "-") . "</td>" .
        "<td style=\"padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;\">" . $qty . "</td>" .
        "<td style=\"padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;\">" . number_format($price, 2) . " MAD</td>" .
        "<td style=\"padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;\">" . number_format($subtotal, 2) . " MAD</td>" .
        "</tr>";
}

$html = "<div style=\"font-family:Arial,sans-serif;color:#0f172a;\">" .
    "<h2>New Order: " . htmlspecialchars($orderId) . "</h2>" .
    "<p><strong>Date:</strong> " . htmlspecialchars($orderDate) . "</p>" .
    "<hr style=\"border:none;border-top:1px solid #e5e7eb;margin:16px 0;\" />" .
    "<h3>Customer Information</h3>" .
    "<p><strong>Name:</strong> " . htmlspecialchars($fullName) . "</p>" .
    "<p><strong>Phone:</strong> " . htmlspecialchars($phone) . "</p>" .
    "<p><strong>Address:</strong> " . htmlspecialchars($address) . "</p>" .
    "<p><strong>City:</strong> " . htmlspecialchars($city) . "</p>" .
    "<p><strong>Postal Code:</strong> " . htmlspecialchars($postalCode) . "</p>" .
    "<h3>Items</h3>" .
    "<table style=\"width:100%;border-collapse:collapse;\">" .
    "<thead><tr>" .
    "<th style=\"text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;\">Item</th>" .
    "<th style=\"text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;\">Options</th>" .
    "<th style=\"text-align:center;padding:10px;border-bottom:1px solid #e5e7eb;\">Qty</th>" .
    "<th style=\"text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;\">Price</th>" .
    "<th style=\"text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;\">Subtotal</th>" .
    "</tr></thead>" .
    "<tbody>" . $rowsHtml . "</tbody>" .
    "</table>" .
    "<h3 style=\"text-align:right;margin-top:16px;\">Total: " . number_format($total, 2) . " MAD</h3>" .
    "</div>";

$subject = "New Order " . $orderId;

$smtpUser = "lecomaxstore@gmail.com";
$smtpPass = "YOUR_APP_PASSWORD_HERE"; // replace with your Gmail App Password

require __DIR__ . "/vendor/autoload.php";

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = "smtp.gmail.com";
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom($smtpUser, "Lecomax Orders");
    $mail->addAddress("lecomaxstore@gmail.com");
    $mail->Subject = $subject;
    $mail->isHTML(true);
    $mail->Body = $html;

    $mail->send();
    echo json_encode(["ok" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "message" => "Email send failed"]);
}
