const SANDBOX = "https://cybqa.pesapal.com/pesapalv3/api";
const LIVE = "https://pay.pesapal.com/v3/api";

async function getToken(base) {
  const r = await fetch(`${base}/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    })
  });
  return r.json();
}

exports.handler = async (event) => {
  try {
    const env = process.env.PESAPAL_ENV || "SANDBOX";
    const base = env === "LIVE" ? LIVE : SANDBOX;

    const orderTrackingId = event.queryStringParameters?.orderTrackingId;
    if (!orderTrackingId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing orderTrackingId" })
      };
    }

    const tokenRes = await getToken(base);
    const token = tokenRes.token;

    const r = await fetch(`${base}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await r.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data })
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Status check failed" })
    };
  }
};