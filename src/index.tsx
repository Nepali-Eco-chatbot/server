import { Hono } from "hono";
import { renderer } from "./renderer";
import { env } from "hono/adapter";

const app = new Hono();

app.use(renderer);

app.get("/", (c) => {
  return c.render(
    <div>
      <h1>Hello Team! </h1>
      <p>Nepali Eco Chatbot</p>
    </div>,
  );
});

app.get("/webhook", (c) => {
  // verification token sent by wp api
  const verificationToken = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  const { META_WP_API_VERIFICATION_TOKEN: server_verification_token } = env<{
    META_WP_API_VERIFICATION_TOKEN: string;
  }>(c);

  if (!server_verification_token) throw new Error("Server Env not found");
  if (!verificationToken)
    throw new Error("Meta did not send verification token");
  if (!challenge) throw new Error("Meta did not send any challenge");

  if (verificationToken === server_verification_token) {
    return c.text(challenge, 200);
  }

  return c.text("Invalid verification token", 401);
});
async function sendTypingIndicator(messageId: string, phoneNumberId: string, accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, {
    method: "POST",
     headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
     body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
      typing_indicator: {
        type: "text",
      },
    }),
  });
   const data = await response.json();
  return data;
}
app.post("/webhook", async (c) => {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = env<{
    WHATSAPP_ACCESS_TOKEN: string;
    WHATSAPP_PHONE_NUMBER_ID: string;
  }>(c);

  const body = await c.req.json();

  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    return c.text("EVENT_RECEIVED", 200);
  }
  const messageId = message.id;

  await sendTypingIndicator(messageId, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN);

  return c.text("EVENT_RECEIVED", 200);
});
export default app;
