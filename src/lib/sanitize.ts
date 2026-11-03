/**
 * تنظيف مدخلات المستخدم قبل استخدامها في رسالة الطلب.
 * - يحذف محارف التحكم ومحارف اتجاه النص الخفية (قد تُستخدم لتزوير شكل الرسالة).
 * - يحذف رموز تنسيق واتساب (* _ ~ `) حتى لا يغير العميل شكل الرسالة.
 * - يدمج المسافات ويقص النص إلى الطول الأقصى.
 */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const BIDI_AND_INVISIBLE = /[؜​-‏‪-‮⁠-⁩﻿]/g;
const WHATSAPP_FORMATTING = /[*_~`]/g;

export function sanitizeLine(input: string, maxLength: number): string {
  return input
    .replace(/\r?\n|\r/g, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(BIDI_AND_INVISIBLE, '')
    .replace(WHATSAPP_FORMATTING, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim();
}

export function sanitizeMultiline(input: string, maxLength: number, maxLines = 6): string {
  return input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeLine(line, maxLength))
    .filter(Boolean)
    .slice(0, maxLines)
    .join('\n')
    .slice(0, maxLength)
    .trim();
}
