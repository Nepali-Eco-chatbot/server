import { Hono } from "hono";
import { processUserQuery, verifyWebhook } from "../helpers/processors";

const app = new Hono();

app.get("/", verifyWebhook);
app.post("/", processUserQuery);

export default app;
