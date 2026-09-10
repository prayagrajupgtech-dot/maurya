import handler from "../netlify/functions/admin-users.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
