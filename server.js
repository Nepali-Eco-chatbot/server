const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const VERIFY_TOKEN = "YOUR_SECRET_VERIFY_TOKEN";
const WHATSAPP_ACCESS_TOKEN = "YOUR_META_PERMANENT_ACCESS_TOKEN"; 
const PHONE_NUMBER_ID = "YOUR_WHATSAPP_PHONE_NUMBER_ID";

async function triggerTypingAndReadStatus(messageId) {
    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    const payload = {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
    };

    try {
        console.log(`[Typing/Read] Acknowledging message ID: ${messageId}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const result = await response.json();
            console.error("[Typing/Read] Meta API Error:", result);
        }
    } catch (error) {
        console.error("[Typing/Read] Error sending status update:", error);
    }
}

app.route('/webhook')
    .get((req, res) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("Webhook verified successfully!");
            return res.status(200).send(challenge);
        } else {
            return res.status(403).send("Verification token mismatch");
        }
    })
    .post((req, res) => {
        const data = req.body;
        try {
            const entry = data.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            if (message) {
                const senderNumber = message.from;
                const messageBody = message.text?.body;
                const messageId = message.id;

                console.log(`\n New Message from ${senderNumber}: "${messageBody}"`);
                triggerTypingAndReadStatus(messageId);
            }
        } catch (error) {
            console.error("Error parsing WhatsApp payload:", error);
        }
        return res.status(200).json({ status: "success" });
    });

app.listen(PORT, () => {
    console.log(`Webhook server is running on port ${PORT}`);
});