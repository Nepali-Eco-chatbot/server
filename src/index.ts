import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono();

app.get("/", (c) => {
	// verification token sent by wp api
	const verificationToken = c.req.query("hub.verify_token");
	const challenge = c.req.query("hub.challenge");

	console.log({
		verificationToken,
		challenge,
	});

	const { META_WP_API_VERIFICATION_TOKEN: server_verification_token } = env<{
		META_WP_API_VERIFICATION_TOKEN: string;
	}>(c);

	if (!server_verification_token) {
		return c.text("Server Env not found", 500);
	}

	if (!verificationToken) {
		return c.text("Meta did not send verification token", 400);
	}

	if (!challenge) {
		return c.text("Meta did not send any challenge", 400);
	}

	if (verificationToken === server_verification_token) {
		return c.text(challenge, 200);
	}

	return c.text("Invalid verification token", 401);
});

// async function sendTypingIndicator(messageId: string, phoneNumberId: string, accessToken: string) {
// 	const response = await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, {
// 		method: "POST",
// 		headers: {
// 			Authorization: `Bearer ${accessToken}`,
// 			"Content-Type": "application/json",
// 		},
// 		body: JSON.stringify({
// 			messaging_product: "whatsapp",
// 			status: "read",
// 			message_id: messageId,
// 			typing_indicator: {
// 				type: "text",
// 			},
// 		}),
// 	});
//
// 	const data = await response.json();
// 	return data;
// }

export default app;
