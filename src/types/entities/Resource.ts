export type ResourceEntity = {
  images: ResourceEntity_Images;
};

export type ResourceEntity_Images = {
  [imageId: number]: string | undefined;
};
