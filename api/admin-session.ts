import handler from "../netlify/functions/admin-session";
import { createVercelHandler } from "../server/vercel-adapter";

export default createVercelHandler(handler);
