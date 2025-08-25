export async function handler(event, context) {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzFokKj8jjfEKwVWkU4rxbN9Cbd5XISzng05nVmnpMQQNHC14oPdlWrXWeLVe1P8_vX/exec";

  try {
    let response;
    if (event.httpMethod === "GET") {
      const url = GOOGLE_SCRIPT_URL + (event.rawQueryString ? "?" + event.rawQueryString : "");
      response = await fetch(url);
    } else if (event.httpMethod === "POST") {
      response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: event.body
      });
    }

    const text = await response.text();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Proxy error", details: err.message })
    };
  }
}
