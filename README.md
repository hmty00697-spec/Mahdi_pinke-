# MAHDI-PINK 💗

سایت تک‌صفحه‌ای دو مرحله‌ای، مناسب موبایل، با دکمه‌های فراری و اعلان تلگرام از طریق Cloudflare Worker.

## فایل‌ها
- `index.html`, `style.css`, `script.js`: سایت
- `worker.js`: واسط امن اعلان تلگرام
- `wrangler.toml`: تنظیمات Worker

## انتشار سایت
1. این مخزن را در GitHub با نام `MAHDI-PINK` بساز.
2. فایل‌های ریشه پروژه را در مخزن قرار بده.
3. در Cloudflare وارد Workers & Pages شو و Create application > Pages > Connect to Git را انتخاب کن.
4. مخزن `MAHDI-PINK` را انتخاب کن. چون سایت HTML ساده است، Build command را خالی بگذار و Build output directory را `/` قرار بده.
5. Deploy را بزن. آدرس `*.pages.dev` سایتت خواهد بود.

## فعال کردن اعلان تلگرام
1. با BotFather یک ربات بساز و توکن را بردار. توکن را داخل فایل‌های سایت یا GitHub قرار نده.
2. به ربات خودت یک پیام بده و شناسه عددی چت خودت را از روش امن مورداعتمادت به دست بیاور.
3. در Cloudflare یک Worker با نام `mahdi-pink-api` بساز و محتوای `worker.js` را در آن قرار بده.
4. در Worker > Settings > Variables and Secrets دو مقدار Secret بساز:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
5. Worker را Deploy کن و URL آن را کپی کن.
6. URL را در ابتدای `script.js` داخل مقدار `WORKER_URL` قرار بده و فایل را در GitHub به‌روزرسانی کن.

## نکته
- توکن تلگرام فقط در Secretهای Worker می‌ماند.
- اگر Worker یا Secretها تنظیم نشده باشند، خود سایت کار می‌کند ولی اعلان ارسال نمی‌شود.
- برای جلوگیری از اسپم، Worker را بعداً می‌توان با محدودیت تعداد درخواست و بررسی مبدا سایت تقویت کرد.
