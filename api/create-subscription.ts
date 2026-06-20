import handler from "../netlify/functions/create-subscription";
import { createVercelHandler } from "../server/vercel-adapter";

export default createVercelHandler(handler);
