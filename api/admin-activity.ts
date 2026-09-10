import handler from "../netlify/functions/admin-activity.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
