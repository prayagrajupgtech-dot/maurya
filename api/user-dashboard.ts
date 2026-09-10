import handler from "../netlify/functions/user-dashboard.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
