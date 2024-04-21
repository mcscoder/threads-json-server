import { ResponseMessage } from "../types/models/response/Message";

export default class CommonUtils {
  static generateId(array: { id: number }[]) {
    if (array.length === 0) {
      return 1;
    }
    return array[array.length - 1].id + 1;
  }
  static responseMessage(message: string): ResponseMessage {
    return {
      message,
    };
  }
}
