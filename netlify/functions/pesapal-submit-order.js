const SANDBOX = "https://cybqa.pesapal.com/pesapalv3/api";
const LIVE = "https://pay.pesapal.com/v3/api";

async function getToken(base) {
  const response = await fetch(`${base}/Auth/RequestToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    })
  });

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(data?.error?.message || data?.message || "Failed to get Pesapal token.");
  }

  return data.token;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Method not allowed"
        })
      };
    }

    const env = process.env.PESAPAL_ENV || "SANDBOX";
    const base = env === "LIVE" ? LIVE : SANDBOX;

    const { amount, email, name, description } = JSON.parse(event.body || "{}");

    if (!amount || !email || !name) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Amount, email, and name are required."
        })
      };
    }

    const token = await getToken(base);

    const nameParts = String(name).trim().split(/\s+/);
    const firstName = nameParts[0] || "Student";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const payload = {
      id: "CAMPUSCV_" + Date.now(),
      currency: "UGX",
      amount: Number(amount),
      description: description || "CampusCV PDF Download",
      callback_url: process.env.PESAPAL_CALLBACK_URL,
      notification_id: process.env.PESAPAL_IPN_ID,
      billing_address: {
        email_address: email,
        first_name: firstName,
        last_name: lastName,
        country_code: "UG"
      }
    };

    const response = await fetch(`${base}/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: data?.error?.message || data?.message || "Pesapal order submission failed.",
          data
        })
      };
    }

    if (!data.redirect_url) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Pesapal did not return a redirect URL.",
          data
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        redirect_url: data.redirect_url,
        order_tracking_id: data.order_tracking_id || "",
        merchant_reference: data.merchant_reference || payload.id,
        data
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: error.message || "Submit order failed"
      })
    };
  }
};
