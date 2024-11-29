export const formattedDuration = (durationMs: number): string => {
    const durationInSeconds = Math.floor(durationMs / 1000); // Convert milliseconds to seconds
    const sec = durationInSeconds % 60;
    const min = Math.floor(durationInSeconds / 60) % 60;
    const hrs = Math.floor(durationInSeconds / 3600);
    const ms = durationMs % 1000; // Remaining milliseconds
  
    const formattedHrs = hrs > 0 ? `${hrs}h ` : "";
    const formattedMin = min > 0 ? `${min}min ` : "";
    const formattedSec = sec > 0 ? `${sec}s ` : "";
    const formattedMs = ms > 0 ? `${ms}ms` : "";
  
    return `${formattedHrs}${formattedMin}${formattedSec}${formattedMs}`.trim();
  };
export const formatSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ['KB', 'MB', 'GB', 'TB'];
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${sizes[i - 1]}`;
};