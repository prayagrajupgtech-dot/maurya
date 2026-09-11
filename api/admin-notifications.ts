import handler from "../netlify/functions/admin-notifications.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
