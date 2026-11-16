const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control":"no-store" }
  });
}
function validVisitorId(value) {
  return typeof value === "string" && value.length >= 20 && value.length <= 64 && /^[a-zA-Z0-9-]+$/.test(value);
}
function getDevice(ua="") {
  if (/ipad|tablet/i.test(ua)) return "تبلت";
  if (/mobile|android|iphone/i.test(ua)) return "موبایل";
  return "دسکتاپ";
}
function getBrowser(ua="") {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  return "سایر";
}
async function signToken(secret, expires) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  const payload = btoa(JSON.stringify({exp:expires})).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return `${payload}.${sig}`;
}
async function verifyToken(secret, token) {
  if (!token || !token.includes(".")) return false;
  const [payload,sig] = token.split(".");
  const expected = await signToken(secret, 0);
  const expectedSig = expected.split(".")[1];
  if (sig !== expectedSig) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["verify"]);
    const binary = Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, binary, new TextEncoder().encode(payload));
    if (!valid) return false;
  }
  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));
    return decoded.exp > Date.now();
  } catch { return false; }
}
async function requireAdmin(request, env) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i,"");
  return !!(env.ADMIN_SESSION_SECRET && await verifyToken(env.ADMIN_SESSION_SECRET, token));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, {headers:corsHeaders});
    const url = new URL(request.url);

    if (url.pathname === "/api/track" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!validVisitorId(body.visitorId)) return json({ok:false,error:"Invalid visitor id"},400);
        const allowed = ["page_view","first_yes_attempt","second_no_attempt","final_yes"];
        if (!allowed.includes(body.event)) return json({ok:false,error:"Invalid event"},400);

        const ua = request.headers.get("User-Agent") || "";
        const country = request.cf?.country || null;
        await env.DB.prepare(`
          INSERT INTO visitors (id, device_type, browser, country, last_seen)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            last_seen=datetime('now'),
            device_type=excluded.device_type,
            browser=excluded.browser,
            country=excluded.country
        `).bind(body.visitorId,getDevice(ua),getBrowser(ua),country).run();

        await env.DB.prepare(
          "INSERT INTO events (visitor_id,event_type) VALUES (?,?)"
        ).bind(body.visitorId,body.event).run();

        const updates = {
          page_view:"page_views = page_views + 1",
          first_yes_attempt:"first_yes_attempts = first_yes_attempts + 1",
          second_no_attempt:"second_no_attempts = second_no_attempts + 1",
          final_yes:"final_yes = 1"
        };
        await env.DB.prepare(`UPDATE visitors SET ${updates[body.event]}, last_seen=datetime('now') WHERE id=?`)
          .bind(body.visitorId).run();
        return json({ok:true});
      } catch (error) {
        return json({ok:false,error:"Database operation failed"},500);
      }
    }

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({error:"رمز مدیریت و کلید نشست در Cloudflare تنظیم نشده‌اند."},503);
      try {
        const body = await request.json();
        if (typeof body.password !== "string" || body.password.length > 200 || body.password !== env.ADMIN_PASSWORD) {
          return json({error:"رمز عبور درست نیست."},401);
        }
        const token = await signToken(env.ADMIN_SESSION_SECRET, Date.now() + 6*60*60*1000);
        return json({token});
      } catch { return json({error:"درخواست نامعتبر است."},400); }
    }

    if (url.pathname === "/api/admin/stats" && request.method === "GET") {
      if (!await requireAdmin(request,env)) return json({error:"Unauthorized"},401);
      try {
        const summary = await env.DB.prepare(`
          SELECT
            (SELECT COUNT(*) FROM visitors) AS visitors,
            (SELECT COALESCE(SUM(page_views),0) FROM visitors) AS pageViews,
            (SELECT COALESCE(SUM(first_yes_attempts),0) FROM visitors) AS firstYesAttempts,
            (SELECT COALESCE(SUM(second_no_attempts),0) FROM visitors) AS secondNoAttempts,
            (SELECT COALESCE(SUM(final_yes),0) FROM visitors) AS finalYes
        `).first();
        const result = await env.DB.prepare(`
          SELECT id,device_type AS deviceType,browser,country,
            first_yes_attempts AS firstYesAttempts,
            second_no_attempts AS secondNoAttempts,final_yes AS finalYes
          FROM visitors ORDER BY last_seen DESC LIMIT 100
        `).all();
        const visitors = (result.results || []).map(v => ({...v,shortId:v.id.slice(0,8)}));
        return json({summary,visitors});
      } catch { return json({error:"خواندن آمار ناموفق بود."},500); }
    }

    return new Response("MAHDI-PINK Worker is running", {headers:corsHeaders});
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil((async () => {
      await env.DB.prepare("DELETE FROM events WHERE created_at < datetime('now','-24 hours')").run();
      await env.DB.prepare("DELETE FROM visitors WHERE last_seen < datetime('now','-24 hours')").run();
    })());
  }
};
