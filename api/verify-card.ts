import handler from "../netlify/functions/verify-card.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
