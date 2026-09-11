import handler from "../netlify/functions/admin-applications.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
