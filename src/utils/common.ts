import { ResponseMessage } from "../types/models/response/Message";

export default class CommonUtils {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static generateId(object: { [key: number]: any } | undefined): number {
    if (object) {
      const array = Object.keys(object);
      return Number(array[array.length - 1]) + 1;
    }
    return 1;
  }
  static responseMessage(message: string): ResponseMessage {
    return {
      message,
    };
  }
}
