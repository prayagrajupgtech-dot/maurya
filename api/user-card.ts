import handler from "../netlify/functions/user-card.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
