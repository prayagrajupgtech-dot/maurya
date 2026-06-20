import handler from "../netlify/functions/create-card";
import { createVercelHandler } from "../server/vercel-adapter";

export default createVercelHandler(handler);
