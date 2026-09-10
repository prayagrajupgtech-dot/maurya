import handler from "../netlify/functions/admin-cards.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
