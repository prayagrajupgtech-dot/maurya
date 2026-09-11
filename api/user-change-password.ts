import handler from "../netlify/functions/user-change-password.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
