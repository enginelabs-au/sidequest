/** Supabase SMS OTP settings — mirrors hosted project `sms_*` auth config. */
export const SMS_OTP_LENGTH = 6;
/** Seconds until the active code expires (`sms_otp_exp`). */
export const SMS_OTP_EXPIRY_SEC = 60;
/** Seconds before another code can be requested (matches code lifetime). */
export const SMS_RESEND_COOLDOWN_SEC = SMS_OTP_EXPIRY_SEC;

export function formatOtpCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function sanitizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, SMS_OTP_LENGTH);
}
