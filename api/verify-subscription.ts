import handler from "../netlify/functions/verify-subscription";
import { createVercelHandler } from "../server/vercel-adapter";

export default createVercelHandler(handler);
