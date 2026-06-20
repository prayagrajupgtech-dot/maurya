import handler from "../netlify/functions/create-card.js";
import { createVercelHandler } from "../server/vercel-adapter.js";

export default createVercelHandler(handler);
