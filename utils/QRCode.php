<?php
/**
 * QR Code 生成工具
 * 使用 Google Charts API 生成 QR Code
 */

class QRCode {
    
    /**
     * 生成 QR Code URL
     */
    public static function generateURL($data, $size = 200) {
        $encodedData = urlencode($data);
        return "https://chart.googleapis.com/chart?chs={$size}x{$size}&cht=qr&chl={$encodedData}";
    }
    
    /**
     * 生成優惠券使用憑證
     */
    public static function generateCouponVoucher($couponId, $userId, $verificationCode) {
        $voucherData = [
            'type' => 'coupon_voucher',
            'coupon_id' => $couponId,
            'user_id' => $userId,
            'verification_code' => $verificationCode,
            'timestamp' => time(),
            'platform' => '送嗨康'
        ];
        
        $jsonData = json_encode($voucherData);
        return self::generateURL($jsonData, 300);
    }
    
    /**
     * 生成驗證碼
     */
    public static function generateVerificationCode($couponId, $userId) {
        return 'SHK' . str_pad($couponId, 4, '0', STR_PAD_LEFT) . 
               str_pad($userId, 4, '0', STR_PAD_LEFT) . 
               substr(md5(time() . $couponId . $userId), 0, 4);
    }
    
    /**
     * 驗證 QR Code 數據
     */
    public static function verifyVoucher($qrData) {
        try {
            $data = json_decode($qrData, true);
            
            if (!$data || $data['type'] !== 'coupon_voucher') {
                return ['valid' => false, 'error' => '無效的憑證格式'];
            }
            
            // 檢查時效性（24小時內有效）
            if (time() - $data['timestamp'] > 24 * 3600) {
                return ['valid' => false, 'error' => '憑證已過期'];
            }
            
            return ['valid' => true, 'data' => $data];
            
        } catch (Exception $e) {
            return ['valid' => false, 'error' => '憑證解析失敗'];
        }
    }
}
?>
