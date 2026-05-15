#!/bin/bash
# =============================================================
# setup-cron.sh — إعداد Cron Jobs للسيرفر الخاص
# شغّله مرة واحدة على السيرفر:  bash setup-cron.sh
# =============================================================

APP_URL="https://ayadti.duckdns.org"
CRON_SECRET="1617931e9a819bf8834294ac7e8b3841c6a4b4d067b5c24b0865e5532580c491"

# احذف أي Cron قديم للنظام ثم أضف الجديد
(crontab -l 2>/dev/null | grep -v "ayadti.duckdns.org"; cat <<EOF

# ── Clinic SaaS Cron Jobs ──────────────────────────────────────

# تذكيرات المرضى — كل ساعة
0 * * * * curl -s -o /dev/null -w "\%{http_code}" -H "Authorization: Bearer ${CRON_SECRET}" ${APP_URL}/api/cron/reminders >> /var/log/clinic-cron.log 2>&1

# انتهاء الاشتراكات — يومياً منتصف الليل
0 0 * * * curl -s -o /dev/null -w "\%{http_code}" -H "Authorization: Bearer ${CRON_SECRET}" ${APP_URL}/api/cron/expire-subscriptions >> /var/log/clinic-cron.log 2>&1

# نسخة احتياطية — أول كل شهر الساعة 6 صباحاً
0 6 1 * * curl -s -o /dev/null -w "\%{http_code}" -H "Authorization: Bearer ${CRON_SECRET}" ${APP_URL}/api/cron/backup >> /var/log/clinic-cron.log 2>&1

EOF
) | crontab -

echo ""
echo "✅ تم تثبيت Cron Jobs بنجاح!"
echo ""
echo "للتحقق:"
echo "  crontab -l"
echo ""
echo "لمشاهدة السجلات:"
echo "  tail -f /var/log/clinic-cron.log"
echo ""
echo "للاختبار الفوري (تشغيل التذكيرات الآن):"
echo "  curl -H \"Authorization: Bearer ${CRON_SECRET}\" ${APP_URL}/api/cron/reminders"
