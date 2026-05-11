<?php
/**
 * SMTP Mailer for Live Green — uses Hostinger email
 * With admin-controllable toggles via app_settings table.
 */

// SMTP Configuration
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'info@livegreenfarms.in');
define('SMTP_PASS', 'Honeywala@2025');
define('SMTP_FROM_NAME', 'Live Green');
define('SMTP_FROM_EMAIL', 'info@livegreenfarms.in');

/**
 * Check if a specific email type is enabled in app_settings.
 * Returns true if enabled or if key doesn't exist (default on).
 */
function isEmailEnabled($key) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("SELECT key_value FROM app_settings WHERE key_name = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        if (!$row) return true; // Default: enabled
        return $row['key_value'] === '1';
    } catch (Exception $e) {
        return true; // Default: enabled on error
    }
}

/**
 * Send email via SMTP SSL
 */
function sendEmail($to, $subject, $htmlBody) {
    $boundary = md5(uniqid(time()));
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM_EMAIL . ">\r\n";
    $headers .= "Reply-To: " . SMTP_FROM_EMAIL . "\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
    
    $plainText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>', '</li>'], "\n", $htmlBody));
    $plainText = html_entity_decode($plainText);
    
    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $body .= $plainText . "\r\n\r\n";
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
    $body .= $htmlBody . "\r\n\r\n";
    $body .= "--$boundary--\r\n";
    
    try {
        $socket = @fsockopen("ssl://" . SMTP_HOST, SMTP_PORT, $errno, $errstr, 15);
        if (!$socket) {
            error_log("SMTP Connection failed: $errstr ($errno)");
            return false;
        }
        
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '220') { fclose($socket); return false; }
        
        fwrite($socket, "EHLO " . SMTP_HOST . "\r\n");
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        
        fwrite($socket, "AUTH LOGIN\r\n");
        fgets($socket, 515);
        
        fwrite($socket, base64_encode(SMTP_USER) . "\r\n");
        fgets($socket, 515);
        
        fwrite($socket, base64_encode(SMTP_PASS) . "\r\n");
        $authResponse = fgets($socket, 515);
        if (substr($authResponse, 0, 3) !== '235') {
            error_log("SMTP Auth failed: $authResponse");
            fclose($socket);
            return false;
        }
        
        fwrite($socket, "MAIL FROM: <" . SMTP_FROM_EMAIL . ">\r\n");
        fgets($socket, 515);
        
        fwrite($socket, "RCPT TO: <$to>\r\n");
        fgets($socket, 515);
        
        fwrite($socket, "DATA\r\n");
        fgets($socket, 515);
        
        $message = "Subject: $subject\r\n";
        $message .= "To: $to\r\n";
        $message .= $headers;
        $message .= "\r\n";
        $message .= $body;
        $message .= "\r\n.\r\n";
        
        fwrite($socket, $message);
        $dataResponse = fgets($socket, 515);
        
        fwrite($socket, "QUIT\r\n");
        fclose($socket);
        
        return substr($dataResponse, 0, 3) === '250';
        
    } catch (Exception $e) {
        error_log("SMTP Error: " . $e->getMessage());
        return false;
    }
}

// ============================================================
// HTML WRAPPER
// ============================================================
function getEmailWrapper($content) {
    return '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; font-family: "Segoe UI", Tahoma, Geneva, sans-serif; background: #f5f0e8; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1a3c34 0%, #2d5a4e 100%); padding: 32px 40px; text-align: center; }
  .header h1 { color: #f5c518; margin: 0; font-size: 28px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }
  .body-content { padding: 40px; }
  .greeting { font-size: 22px; color: #1a3c34; font-weight: 700; margin-bottom: 8px; }
  .subtitle { color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
  .order-card { background: #f8f6f1; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #f5c518; }
  .order-id { font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .order-id-value { font-size: 18px; color: #1a3c34; font-weight: 700; font-family: monospace; }
  .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .items-table th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; border-bottom: 1px solid #e5e1d8; }
  .items-table td { padding: 12px; font-size: 14px; color: #333; border-bottom: 1px solid #f0ede6; }
  .items-table .price { text-align: right; font-weight: 600; color: #1a3c34; }
  .total-row { background: #1a3c34; color: #fff; }
  .total-row td { padding: 14px 12px; font-weight: 700; font-size: 16px; border: none; }
  .total-row .price { color: #f5c518; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-processing { background: #cce5ff; color: #004085; }
  .status-shipped { background: #e8daef; color: #6c3483; }
  .status-delivered { background: #d4edda; color: #155724; }
  .status-cancelled { background: #f8d7da; color: #721c24; }
  .cta-btn { display: inline-block; background: #f5c518; color: #1a3c34; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0; }
  .divider { height: 1px; background: #e5e1d8; margin: 24px 0; }
  .info-box { background: #f8f6f1; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .footer { background: #1a3c34; padding: 32px 40px; text-align: center; }
  .footer p { color: rgba(255,255,255,0.6); margin: 4px 0; font-size: 12px; }
  .footer a { color: #f5c518; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🍯 Live Green</h1>
    <p>Pure • Raw • Cold-Extracted</p>
  </div>
  <div class="body-content">' . $content . '</div>
  <div class="footer">
    <p><strong style="color:#f5c518;">Live Green</strong></p>
    <p>100% Pure, Raw Honey — From Forest to Your Table</p>
    <p style="margin-top:12px;"><a href="https://livegreenfarms.in">livegreenfarms.in</a> • <a href="mailto:info@livegreenfarms.in">info@livegreenfarms.in</a></p>
    <p style="margin-top:16px; font-size:11px; color:rgba(255,255,255,0.4);">You received this email because you interacted with Live Green.</p>
  </div>
</div>
</body>
</html>';
}

// ============================================================
// EMAIL TEMPLATES (each checks its toggle before sending)
// ============================================================

/** Order Confirmation */
function sendOrderConfirmation($email, $customerName, $orderId, $items, $totalAmount, $paymentMethod, $address, $city, $state, $zip, $trackingInfo = []) {
    if (!isEmailEnabled('email_order_confirmation')) return true;
    
    $itemRows = '';
    foreach ($items as $item) {
        $name = htmlspecialchars($item['name'] ?? 'Product');
        $qty = (int)($item['quantity'] ?? 1);
        $price = number_format(($item['price'] ?? 0) * $qty, 2);
        $itemRows .= "<tr><td>{$name}</td><td style='text-align:center'>×{$qty}</td><td class='price'>₹{$price}</td></tr>";
    }
    $total = number_format($totalAmount, 2);
    $fullAddress = htmlspecialchars("$address, $city, $state - $zip");
    $name = htmlspecialchars($customerName);
    
    $trackingCard = '';
    if (!empty($trackingInfo['awb']) && !empty($trackingInfo['tracking_url'])) {
        $awb = htmlspecialchars($trackingInfo['awb']);
        $url = htmlspecialchars($trackingInfo['tracking_url']);
        $courier = htmlspecialchars($trackingInfo['courier_name'] ?? 'Courier');
        $trackingCard = "
        <div class='order-card' style='border-left-color: #25D366; background: #e8f5e9;'>
            <p class='order-id'>Shipment Tracking ({$courier})</p>
            <p class='order-id-value'>{$awb}</p>
            <p style='margin-top:12px;text-align:center;'><a href='{$url}' class='cta-btn' style='background:#25D366;color:#fff;margin:0;'>Track Your Shipment 🚚</a></p>
        </div>";
    }

    $content = "
    <p class='greeting'>Thank you, {$name}! 🎉</p>
    <p class='subtitle'>Your order has been placed successfully. We're already buzzing to get your pure honey ready!</p>
    <div class='order-card'><p class='order-id'>Order ID</p><p class='order-id-value'>{$orderId}</p></div>
    {$trackingCard}
    <table class='items-table'>
        <thead><tr><th>Product</th><th style='text-align:center'>Qty</th><th style='text-align:right'>Amount</th></tr></thead>
        <tbody>{$itemRows}<tr class='total-row'><td colspan='2'>Total</td><td class='price'>₹{$total}</td></tr></tbody>
    </table>
    <div class='divider'></div>
    <div style='margin-bottom:16px;'>
        <div style='margin-bottom:8px;'><span style='color:#999;font-size:13px;display:inline-block;width:120px;'>Payment:</span> <strong>" . ucfirst($paymentMethod ?? 'Online') . "</strong></div>
        <div style='margin-bottom:8px;'><span style='color:#999;font-size:13px;display:inline-block;width:120px;'>Delivery to:</span> <strong>{$fullAddress}</strong></div>
        <div><span style='color:#999;font-size:13px;display:inline-block;width:120px;'>Status:</span> <span class='status-badge status-pending'>Pending</span></div>
    </div>
    <div class='divider'></div>
    <p style='color:#666;font-size:14px;line-height:1.6;'>We'll notify you when your order is being processed and shipped.</p>
    <p style='text-align:center;'><a href='https://livegreenfarms.in' class='cta-btn'>Visit Our Store</a></p>
    <p style='color:#999;font-size:12px;text-align:center;margin-top:24px;'>Questions? Reply to this email or chat with our Honey Oracle! 🐝</p>";
    
    return sendEmail($email, "🍯 Order Confirmed — {$orderId}", getEmailWrapper($content));
}

/** Order Status Update */
function sendOrderStatusUpdate($email, $customerName, $orderId, $newStatus, $items = [], $totalAmount = 0, $trackingInfo = []) {
    if (!isEmailEnabled('email_order_status')) return true;
    
    $statusMessages = [
        'processing' => ['emoji' => '⚙️', 'title' => 'Your Order is Being Processed!', 'message' => 'We\'re carefully preparing your honey package. It will be shipped soon.', 'badge' => 'status-processing'],
        'shipped' => ['emoji' => '🚚', 'title' => 'Your Order Has Been Shipped!', 'message' => 'Your honey is on its way! Expected delivery in 3-5 business days. Get ready for some pure, golden goodness!', 'badge' => 'status-shipped'],
        'delivered' => ['emoji' => '✅', 'title' => 'Your Order Has Been Delivered!', 'message' => 'Your honey has arrived! We hope you enjoy every drop. We\'d love to hear what you think!', 'badge' => 'status-delivered'],
        'cancelled' => ['emoji' => '❌', 'title' => 'Order Cancelled', 'message' => 'Your order has been cancelled. If this was unexpected, please reach out to us.', 'badge' => 'status-cancelled'],
    ];
    $si = $statusMessages[$newStatus] ?? ['emoji' => '📦', 'title' => 'Order Updated', 'message' => "Status updated to: {$newStatus}.", 'badge' => 'status-pending'];
    $name = htmlspecialchars($customerName ?: 'Valued Customer');
    
    $reviewCTA = ($newStatus === 'delivered') ? "
    <div class='divider'></div>
    <p style='text-align:center;color:#666;font-size:14px;'><strong>How was your honey?</strong> 🍯<br>We'd love to hear from you!</p>
    <p style='text-align:center;'><a href='https://livegreenfarms.in' class='cta-btn'>Leave a Review</a></p>" : "";
    
    $trackingCard = '';
    if (!empty($trackingInfo['awb']) && !empty($trackingInfo['url'])) {
        $awb = htmlspecialchars($trackingInfo['awb']);
        $url = htmlspecialchars($trackingInfo['url']);
        $trackingCard = "
        <div class='order-card' style='border-left-color: #25D366; background: #e8f5e9;'>
            <p class='order-id'>Live Tracking ID (AWB)</p>
            <p class='order-id-value'>{$awb}</p>
            <p style='margin-top:12px;text-align:center;'><a href='{$url}' class='cta-btn' style='background:#25D366;color:#fff;margin:0;'>Track iCarry Shipment</a></p>
        </div>";
    }

    $content = "
    <p class='greeting'>{$si['emoji']} Hey {$name}!</p>
    <p class='subtitle'>{$si['message']}</p>
    <div class='order-card'><p class='order-id'>Order ID</p><p class='order-id-value'>{$orderId}</p>
        <div style='margin-top:12px;'><span class='status-badge {$si['badge']}'>" . ucfirst($newStatus) . "</span></div>
    </div>{$trackingCard}{$reviewCTA}
    <p style='color:#999;font-size:12px;text-align:center;margin-top:24px;'>Track your order on our website or chat with our Prakruthi Bot! 🐝</p>";
    
    return sendEmail($email, "{$si['emoji']} {$si['title']} — {$orderId}", getEmailWrapper($content));
}

/** Welcome Email */
function sendWelcomeEmail($email, $customerName) {
    if (!isEmailEnabled('email_welcome')) return true;
    $name = htmlspecialchars($customerName);
    
    $content = "
    <p class='greeting'>Welcome to the Hive, {$name}! 🐝</p>
    <p class='subtitle'>Thank you for choosing Live Green. You've joined a community that believes in pure, raw honey — straight from India's finest forests.</p>
    <div class='info-box'>
        <p style='font-size:16px;color:#1a3c34;font-weight:700;margin-bottom:12px;'>Why Our Honey is Special:</p>
        <p style='color:#666;font-size:14px;line-height:1.8;margin:0;'>
            🌿 <strong>100% Raw</strong> — Never heated, never filtered<br>
            🏔️ <strong>Forest Sourced</strong> — From Himalayan & Indian forests<br>
            🧪 <strong>Lab Tested</strong> — Every batch verified for purity<br>
            📦 <strong>Cold Extracted</strong> — Preserving all natural enzymes
        </p>
    </div>
    <p style='text-align:center;'><a href='https://livegreenfarms.in' class='cta-btn'>Explore Our Honey</a></p>";
    
    return sendEmail($email, "🐝 Welcome to Live Green, {$name}!", getEmailWrapper($content));
}

/** Inquiry Confirmation (to customer) */
function sendInquiryConfirmation($email, $name, $subject) {
    if (!isEmailEnabled('email_inquiry_confirmation')) return true;
    $safeName = htmlspecialchars($name);
    $safeSubject = htmlspecialchars($subject);
    
    $content = "
    <p class='greeting'>Got it, {$safeName}! 📬</p>
    <p class='subtitle'>We've received your inquiry about <strong>\"{$safeSubject}\"</strong>. Our team will get back to you within 24 hours.</p>
    <div class='info-box'>
        <p style='color:#666;font-size:14px;line-height:1.8;margin:0;'>
            ⏰ <strong>Response Time:</strong> Within 24 hours<br>
            📧 <strong>Reply to:</strong> info@livegreenfarms.in<br>
            💬 <strong>Quick Help:</strong> Chat with our AI Honey Oracle on the website!
        </p>
    </div>
    <p style='text-align:center;'><a href='https://livegreenfarms.in' class='cta-btn'>Visit Live Green</a></p>";
    
    return sendEmail($email, "📬 We Received Your Inquiry — {$safeSubject}", getEmailWrapper($content));
}

/** Inquiry Admin Notification */
function sendInquiryAdminNotify($customerName, $customerEmail, $subject, $message) {
    if (!isEmailEnabled('email_inquiry_admin_notify')) return true;
    $safeName = htmlspecialchars($customerName);
    $safeEmail = htmlspecialchars($customerEmail);
    $safeSubject = htmlspecialchars($subject);
    $safeMessage = nl2br(htmlspecialchars($message));
    
    $content = "
    <p class='greeting'>New Inquiry Received 📩</p>
    <p class='subtitle'>A customer has submitted an inquiry through the website.</p>
    <div class='order-card'>
        <div style='margin-bottom:8px;'><span style='color:#999;font-size:13px;display:inline-block;width:80px;'>From:</span> <strong>{$safeName}</strong></div>
        <div style='margin-bottom:8px;'><span style='color:#999;font-size:13px;display:inline-block;width:80px;'>Email:</span> <strong><a href='mailto:{$safeEmail}'>{$safeEmail}</a></strong></div>
        <div style='margin-bottom:8px;'><span style='color:#999;font-size:13px;display:inline-block;width:80px;'>Subject:</span> <strong>{$safeSubject}</strong></div>
        <div class='divider'></div>
        <p style='color:#333;font-size:14px;line-height:1.6;'>{$safeMessage}</p>
    </div>
    <p style='text-align:center;'><a href='https://livegreenfarms.in/admin' class='cta-btn'>View in Admin Panel</a></p>";
    
    return sendEmail(SMTP_FROM_EMAIL, "📩 New Inquiry: {$safeSubject} — from {$safeName}", getEmailWrapper($content));
}

/** Referral Notification (to referred friend) */
function sendReferralEmail($referredEmail, $referrerEmail) {
    if (!isEmailEnabled('email_referral')) return true;
    
    $content = "
    <p class='greeting'>You've Been Invited! 🎁</p>
    <p class='subtitle'>Your friend <strong>" . htmlspecialchars($referrerEmail) . "</strong> thinks you'd love Live Green's pure, raw honey — and we agree!</p>
    <div class='info-box'>
        <p style='text-align:center;font-size:16px;color:#1a3c34;font-weight:700;margin:0;'>
            🍯 Discover India's Purest Honey 🍯
        </p>
        <p style='text-align:center;color:#666;font-size:14px;margin-top:8px;'>
            100% raw, cold-extracted, lab-tested for purity. Sourced from India's pristine forests.
        </p>
    </div>
    <p style='text-align:center;'><a href='https://livegreenfarms.in' class='cta-btn'>Explore Our Honey</a></p>
    <p style='color:#999;font-size:12px;text-align:center;margin-top:24px;'>Referred by a fellow honey lover. Pure taste, pure trust. 🐝</p>";
    
    return sendEmail($referredEmail, "🎁 Your Friend Recommends Live Green Honey!", getEmailWrapper($content));
}

/** Referral Thank You (to referrer) */
function sendReferralThankYou($referrerEmail, $referredEmail) {
    if (!isEmailEnabled('email_referral')) return true;
    
    $content = "
    <p class='greeting'>Thank You for Spreading the Love! 🐝</p>
    <p class='subtitle'>You've referred <strong>" . htmlspecialchars($referredEmail) . "</strong> to Live Green. We've sent them an invite!</p>
    <div class='info-box'>
        <p style='color:#666;font-size:14px;line-height:1.8;margin:0;text-align:center;'>
            Every referral helps us grow the community of people who choose pure, raw honey. Thank you for being part of the hive! 🍯
        </p>
    </div>
    <p style='text-align:center;'><a href='https://livegreenfarms.in' class='cta-btn'>Visit Live Green</a></p>";
    
    return sendEmail($referrerEmail, "🐝 Thanks for Referring a Friend!", getEmailWrapper($content));
}

/** Waitlist Back-in-Stock Notification */
function sendWaitlistNotification($email, $productName, $productId) {
    global $pdo;
    if (!isEmailEnabled('email_waitlist_notify')) return true;
    
    $safeName = htmlspecialchars($productName);
    $productUrl = "https://livegreenfarms.in/product/" . (int)$productId;
    
    $content = "
    <p class='greeting'>It's Back! 🍯</p>
    <p class='subtitle'>Great news! The <strong>{$safeName}</strong> you've been waiting for is finally back in stock.</p>
    <div class='info-box'>
        <p style='text-align:center;font-size:16px;color:#1a3c34;font-weight:700;margin:0;'>
            Hurry before it sells out again!
        </p>
        <p style='text-align:center;color:#666;font-size:14px;margin-top:8px;'>
            Because our honey is 100% natural and harvested in small batches, stock is always limited.
        </p>
    </div>
    <p style='text-align:center;'><a href='{$productUrl}' class='cta-btn'>Claim Your Jar Now</a></p>
    <p style='color:#999;font-size:12px;text-align:center;margin-top:24px;'>You received this because you asked us to notify you. 🐝</p>";
    
    return sendEmail($email, "🍯 Back in Stock: {$safeName}!", getEmailWrapper($content));
}
?>
