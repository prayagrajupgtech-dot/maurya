import handler from "../netlify/functions/razorpay-webhook.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
