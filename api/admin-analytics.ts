import handler from "../netlify/functions/admin-analytics.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
