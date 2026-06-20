import handler from "../netlify/functions/verify-card";
import { createVercelHandler } from "../server/vercel-adapter";

export default createVercelHandler(handler);
