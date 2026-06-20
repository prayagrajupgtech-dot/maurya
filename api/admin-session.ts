import handler from "../netlify/functions/admin-session.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
