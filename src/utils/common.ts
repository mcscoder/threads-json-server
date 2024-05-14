import { DateTime } from "../types/entities/Common";
import { ResponseMessage } from "../types/models/response/Message";

export default class CommonUtils {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static generateId(object: { [key: number]: any } | undefined): number {
    if (object) {
      const array = Object.keys(object);
      if (array.length === 0) {
        return 1;
      }
      return Number(array[array.length - 1]) + 1;
    }
    return 1;
  }

  static responseMessage(message: string): ResponseMessage {
    return {
      message,
    };
  }

  static getCurrentDate(): DateTime {
    return {
      dateTime: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
  }
}
