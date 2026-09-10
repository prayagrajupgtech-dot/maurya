import handler from "../netlify/functions/user-auth.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
