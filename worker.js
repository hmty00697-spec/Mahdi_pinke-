// Cloudflare Worker: اعلان انتخاب «آره» را بدون افشای توکن تلگرام ارسال می‌کند.
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    try {
      const body = await request.json();
      if (body.event !== "yes_clicked") {
        return Response.json({ ok: false }, { status: 400, headers: cors });
      }
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        return Response.json({ ok: false, error: "Missing server secrets" }, { status: 500, headers: cors });
      }
      const message = "💗 یکی روی «آره» زد!\n😂 یکی می‌خواد دوست‌دخترت بشه!\n🌸 سایت: MAHDI-PINK";
      const telegram = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message })
      });
      if (!telegram.ok) return Response.json({ ok: false }, { status: 502, headers: cors });
      return Response.json({ ok: true }, { headers: cors });
    } catch {
      return Response.json({ ok: false }, { status: 400, headers: cors });
    }
  }
};
