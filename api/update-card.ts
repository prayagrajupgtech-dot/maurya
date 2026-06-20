import handler from "../netlify/functions/update-card";
import { createVercelHandler } from "../server/vercel-adapter";

export default createVercelHandler(handler);
