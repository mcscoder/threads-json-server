import path from "path";

export const commonPath = {
  publicImage: path.join(__dirname, "../../public/images"),
  getImageUrl(imageFileName: string) {
    return `public/images/${imageFileName}`;
  },
};
