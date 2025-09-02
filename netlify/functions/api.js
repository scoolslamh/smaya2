export async function handler(event, context) {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwU1qffSjb0s6JYHn0hUjAiW1pcw-fDWeQernxpAdNorcYaeN8LtO6UmZgeBou1nRk0/exec";

  try {
    let response;
    if (event.httpMethod === "GET") {
      const url = GOOGLE_SCRIPT_URL + (event.rawQueryString ? "?" + event.rawQueryString : "");
      console.log("🔗 Proxy forwarding GET to:", url); // ✅ طباعة الرابط النهائي
      response = await fetch(url);
    } else if (event.httpMethod === "POST") {
      console.log("📩 Proxy forwarding POST to:", GOOGLE_SCRIPT_URL, "body:", event.body);
      response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: event.body
      });
    }

    const text = await response.text();
    console.log("📦 Raw response from Apps Script:", text); // ✅ طباعة الرد الخام

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: text
    };
  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Proxy error", details: err.message })
    };
  }
}
