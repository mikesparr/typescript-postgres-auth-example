/**
 * Helper functions to standardize Dates, Emails, Phone Numbers, etc.
 */
import moment from "moment";
import { PhoneNumberUtil, PhoneNumber, PhoneNumberFormat } from "google-libphonenumber";
import logger from "../config/logger";
import ApiResponse from "../interfaces/response.interface";

export enum DataType {
  CREDIT_CARD = "creditCard",
  CREDIT_CARD_EXP = "creditCardExp",
  DATE = "date",
  EMAIL = "email",
  PHONE = "phone",
  TIMESTAMP = "timestamp",
}
// TODO: consider currency and i18n decimals vs. commas

export class Formatter {
  private locale: string;
  private phoneUtil: PhoneNumberUtil;

  constructor(locale?: string) {
    this.phoneUtil = PhoneNumberUtil.getInstance();
    this.locale = locale ? locale : "en_US";
  }

  public format = (value: any, type: DataType) => {
    switch (type) {
      case DataType.CREDIT_CARD:
        const formattedCard: string = `${value}`.replace(/\D/g, ""); // strip non-numeric
        if (this.checkLuhn(formattedCard)) {
          return formattedCard;
        } else {
          return null;
        }
      case DataType.DATE:
        const formattedDate: string = moment.utc(value).toISOString();
        return formattedDate ? formattedDate : null;
      case DataType.EMAIL:
        if (this.isValidEmail(value)) {
          return `${value}`.trim().toLowerCase();
        } else {
          return null;
        }
      case DataType.PHONE:
        let phone: string = `${value}`.trim(); // trim
        const phoneNumber: PhoneNumber = this.phoneUtil.parseAndKeepRawInput(phone, "US");
        // check if valid, otherwise return null
        if (!this.phoneUtil.isValidNumberForRegion(phoneNumber, "US")) {
          logger.debug(`Phone ${phone} was invalid`);
          return null;
        } else {
          phone = this.phoneUtil.format(phoneNumber, PhoneNumberFormat.E164);
          logger.debug(`Returning formatted phone ${phone}`);
          return phone;
        }
      case DataType.TIMESTAMP:
        const formattedTimestamp: number = moment.utc(value).valueOf(); // UNIX with mills
        return formattedTimestamp && !isNaN(formattedTimestamp) ? formattedTimestamp : null;
      default:
        logger.debug(`No compatible type so just returning raw value`); // should be impossible with Enum
        return value;
    }
  }

  public formatResponse = (result: any, time: number, message?: string, total?: number): ApiResponse => {
    let numRecords: number = 0;
    let errors: Error[] = null;
    let data: any = null;

    if (result && result instanceof Array) {
      numRecords = result.length;
      data = result;
    } else if (result && result instanceof Error) {
      errors = [result];
    } else if (result || result === 0) {
      numRecords = 1;
      data = result;
    }

    const response: ApiResponse = {
      data,
      errors,
      message: message ? message : null,
      meta: {
        length: numRecords,
        took: time,
        total: total ? total : numRecords,
      },
    };

    return response;
  }

  private isValidEmail = (email: string): boolean => {
    // tslint:disable-next-line:max-line-length
    const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return re.test(String(email).trim().toLowerCase());
  }

  private checkLuhn = (cardNumber: string): boolean => {
    let s: number = 0;
    let doubleDigit: boolean = false;
    for (let i: number = cardNumber.length - 1; i >= 0; i--) {
        let digit: number = +cardNumber[i];
        if (doubleDigit) {
            digit *= 2;
            if (digit > 9) {
              digit -= 9;
            }
        }
        s += digit;
        doubleDigit = !doubleDigit;
    }
    return s % 10 === 0;
  }

}
