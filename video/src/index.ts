import { registerRoot } from "remotion";
import { loadFonts } from "./fonts";
import { RemotionRoot } from "./Root";

loadFonts();
registerRoot(RemotionRoot);
