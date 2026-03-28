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
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const env = process.env.PESAPAL_ENV || "SANDBOX";
    const base = env === "LIVE" ? LIVE : SANDBOX;

    const { amount, email, name, description } = JSON.parse(event.body || "{}");

    const tokenRes = await getToken(base);
    const token = tokenRes.token;

    const payload = {
      id: "CAMPUSCV_" + Date.now(),
      currency: "UGX",
      amount: Number(amount),
      description: description || "CampusCV PDF Download",
      callback_url: process.env.PESAPAL_CALLBACK_URL,
      notification_id: process.env.PESAPAL_IPN_ID,
      billing_address: {
        email_address: email,
        first_name: name.split(" ")[0] || name,
        last_name: name.split(" ").slice(1).join(" ") || "",
        country_code: "UG"
      }
    };

    const r = await fetch(`${base}/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data })
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Submit order failed" })
    };
  }
};