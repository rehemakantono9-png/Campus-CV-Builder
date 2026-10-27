const SANDBOX = "https://cybqa.pesapal.com/pesapalv3/api";
const LIVE = "https://pay.pesapal.com/v3/api";

exports.handler = async () => {
  try {
    const env = process.env.PESAPAL_ENV || "SANDBOX";
    const base = env === "LIVE" ? LIVE : SANDBOX;

    const r = await fetch(`${base}/Auth/RequestToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
      })
    });

    const data = await r.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Token request failed" })
    };
  }
};