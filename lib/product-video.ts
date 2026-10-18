/** Resolve player-page links before handing them to the native media element. */
export function productVideoMedia(value: string, fallbackPoster?: string) {
  let src = value.trim();
  let poster = fallbackPoster;
  try {
    let url = new URL(src);
    if (url.hostname === "player.cloudinary.com" && /^\/embed\/?$/.test(url.pathname)) {
      const cloud = url.searchParams.get("cloud_name") ?? "";
      const id = url.searchParams.get("public_id") ?? "";
      if (!/^[a-zA-Z0-9_-]+$/.test(cloud) || !id || id.split("/").some(part => !part || part === "." || part === "..")) {
        return { src: "", poster, error: "Lien Cloudinary incomplet." };
      }
      const publicId = id.replace(/\.(mp4|mov|webm|mkv|avi)$/i, "").split("/").map(encodeURIComponent).join("/");
      url = new URL(`https://res.cloudinary.com/${cloud}/video/upload/f_mp4,vc_h264,ac_aac/${publicId}.mp4`);
      src = url.href;
    }
    // Do not rewrite signed URLs or guess that an image/raw asset is a video.
    if (url.hostname === "res.cloudinary.com" && /^\/[^/]+\/video\/upload\//.test(url.pathname) && !url.search && !/\/s--[^/]+--\//.test(url.pathname)) {
      const thumbnail = new URL(url);
      thumbnail.pathname = thumbnail.pathname.replace(/\/upload\//, "/upload/so_0/").replace(/f_mp4,vc_h264,ac_aac\//, "").replace(/\.[^/.]+$/, ".jpg");
      if (!thumbnail.pathname.endsWith(".jpg")) thumbnail.pathname += ".jpg";
      poster = thumbnail.href;
    }
    if (!["https:", "http:"].includes(url.protocol)) return { src: "", poster, error: "URL vidéo invalide." };
  } catch {
    return { src: "", poster, error: "URL vidéo invalide." };
  }
  return { src, poster, error: undefined };
}
