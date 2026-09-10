import handler from "../netlify/functions/user-session.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
