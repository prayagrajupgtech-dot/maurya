import handler from "../netlify/functions/create-subscription.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
