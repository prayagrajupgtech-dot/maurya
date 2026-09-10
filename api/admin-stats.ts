import handler from "../netlify/functions/admin-stats.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
