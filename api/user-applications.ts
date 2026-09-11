import handler from "../netlify/functions/user-applications.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
