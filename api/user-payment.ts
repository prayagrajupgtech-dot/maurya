import handler from "../netlify/functions/user-payment.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
