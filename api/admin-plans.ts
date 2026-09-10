import handler from "../netlify/functions/admin-plans.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
