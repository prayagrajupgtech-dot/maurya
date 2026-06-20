import handler from "../netlify/functions/verify-subscription.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
