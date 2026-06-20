import handler from "../netlify/functions/razorpay-webhook";
import { createVercelHandler } from "../server/vercel-adapter";

export default createVercelHandler(handler);
