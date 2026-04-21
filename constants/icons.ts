import football from "@/assets/icons/football.png";
import news from "@/assets/icons/news.png";
import points from "@/assets/icons/points.png";
import settings from "@/assets/icons/settings.png";

export const icons = { settings, news, points, football } as const;

export type IconKey = keyof typeof icons;