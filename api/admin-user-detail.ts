import handler from "../netlify/functions/admin-user-detail.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
