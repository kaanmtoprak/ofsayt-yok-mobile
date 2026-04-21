export const formatSeasonLabel = (name: string): string => {
  return name.trim().replace(/\s*\/\s*/g, "-");
};
