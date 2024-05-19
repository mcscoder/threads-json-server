export type DateTime = {
  dateTime: EntityDate;
};

export type EntityDate = {
  createdAt: number;
  updatedAt: number;
};

export type ExistOrNot<T> = T | undefined;
