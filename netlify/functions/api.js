export async function handler(event, context) {
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbypAMTh1uJbpkE-94KjtZlT2l5HG_mMhhoZcRrKwyVKA9E0Eurs66asT_sTRRIydEc6/exec";

  try {
    // ✅ معالجة طلبات الـ OPTIONS (مطلوبة للـ CORS)
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: ""
      };
    }

    let response;
    if (event.httpMethod === "GET") {
      const url =
        GOOGLE_SCRIPT_URL + (event.rawQueryString ? "?" + event.rawQueryString : "");
      console.log("🔗 Proxy forwarding GET to:", url);

      response = await fetch(url);
    } else if (event.httpMethod === "POST") {
      console.log("📩 Proxy forwarding POST to:", GOOGLE_SCRIPT_URL, "body:", event.body);

      response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: event.body
      });
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // ✅ الرد القادم من Google Apps Script
    const text = await response.text();
    console.log("📦 Raw response from Apps Script:", text);

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
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Proxy error", details: err.message })
    };
  }
}
