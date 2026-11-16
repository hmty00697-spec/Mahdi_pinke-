# بسته‌ی بازطراحی MAHDI-PINK

این بسته برای شاخه‌ی `redesign-v2` ساخته شده است.

## فایل‌ها
- `index.html`, `style.css`, `script.js`: سایت ساده‌تر، دکمه‌های متحرک، منوی مدیریت و آمار
- `worker.js`: API ثبت رویدادها، ورود مدیر، نمایش آمار و پاک‌سازی زمان‌بندی‌شده
- `wrangler.toml`: اتصال Worker به D1
- `migrations/0001_init.sql`: ساخت جدول‌ها
- `.github/workflows/deploy-worker.yml`: اجرای migration و انتشار Worker از GitHub Actions

## نکات امنیت و حریم خصوصی
- IP خام ذخیره نمی‌شود.
- شناسه‌ی بازدیدکننده تصادفی و محلی است.
- فقط نوع کلی دستگاه، نام کلی مرورگر، کشور تقریبی و رویدادهای دکمه‌ها ذخیره می‌شوند.
- اطلاعات رویدادها پس از ۲۴ ساعت پاک می‌شوند؛ بازدیدکننده‌ای که دوباره فعال شود، زمان آخرین فعالیتش تازه می‌شود.
- پنل مدیریت به `ADMIN_PASSWORD` و `ADMIN_SESSION_SECRET` در Cloudflare نیاز دارد. هیچ رمزی داخل فایل‌های سایت قرار ندهید.

## راه‌اندازی
1. محتویات این بسته را در ریشه‌ی شاخه‌ی `redesign-v2` مخزن GitHub قرار دهید و فایل‌های هم‌نام را جایگزین کنید.
2. در GitHub > Settings > Secrets and variables > Actions این Secrets را بسازید:
   - `CLOUDFLARE_API_TOKEN`: توکن API با دسترسی لازم برای Workers و D1
   - `CLOUDFLARE_ACCOUNT_ID`: شناسه حساب Cloudflare
3. در Cloudflare Worker با نام `mahdi-pinke` این دو Secret را تنظیم کنید:
   - `ADMIN_PASSWORD`: رمز دلخواه و قوی مدیر
   - `ADMIN_SESSION_SECRET`: رشته‌ی تصادفی و طولانی، حداقل ۳۲ کاراکتر
4. بعد از Commit، GitHub Actions باید migration دیتابیس و deploy را اجرا کند.
5. فایل‌های سایت را هم در میزبان Pages فعلی منتشر کنید.

**مهم:** مقدار رمزها را در گفتگو، فایل‌های GitHub یا کد JavaScript قرار ندهید. آن‌ها را فقط در بخش Secrets/Variables مربوط به Cloudflare Worker تنظیم کنید.
