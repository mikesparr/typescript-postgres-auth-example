import { DataType, Formatter } from "../formatter";
const fmt: Formatter = new Formatter();

describe("Formatter", () => {
  describe("format", () => {
    it("returns non-numeric non-whitespace string of digits if valid credit card", () => {
      const testCard: string = "4111 1111 1111 1111";
      const expected: string = "4111111111111111";
      const result = fmt.format(testCard, DataType.CREDIT_CARD);
      expect(result).toEqual(expected);
    });

    it("returns null if invalid credit card number", () => {
      const testCard: string = "4111 1111 111 1111";
      const expected: string = null;
      const result = fmt.format(testCard, DataType.CREDIT_CARD);
      expect(result).toEqual(expected);
    });

    it("formats dates to UTC in ISO 8601 format", () => {
      const testDate: string = "03-21-2018 08:15:00";
      const expected: string = "2018-03-21T08:15:00.000Z";
      const result = fmt.format(testDate, DataType.DATE);
      expect(result).toEqual(expected);
    });

    it("returns null if invalid date", () => {
      const testDate: string = "Friday";
      const expected: string = null;
      const result = fmt.format(testDate, DataType.DATE);
      expect(result).toEqual(expected);
    });

    it("formats emails to lowercase trimmed string", () => {
      const testEmail: string = "TestPerson@myco.com ";
      const expected: string = "testperson@myco.com";
      const result = fmt.format(testEmail, DataType.EMAIL);
      expect(result).toEqual(expected);
    });

    it("returns null if invalid email", () => {
      const testEmail: string = "TestPerson@myco";
      const expected: string = null;
      const result = fmt.format(testEmail, DataType.EMAIL);
      expect(result).toEqual(expected);
    });

    it("formats phones to E164 format", () => {
      const testPhone: string = "1-406-555-1234";
      const expected: string = "+14065551234";
      const result = fmt.format(testPhone, DataType.PHONE);
      expect(result).toEqual(expected);
    });

    it("returns null if not valid phone", () => {
      const testPhone: string = "555-1234";
      const expected: string = null;
      const result = fmt.format(testPhone, DataType.PHONE);
      expect(result).toEqual(expected);
    });

    it("formats dates to UTC in UNIX timestamp with millis", () => {
      const testDate: string = "03-21-2018 08:15:00";
      const expected: number = 1521620100000;
      const result = fmt.format(testDate, DataType.TIMESTAMP);
      expect(result).toEqual(expected);
    });

    it("returns null if invalid date", () => {
      const testDate: string = "Friday";
      const expected: number = null;
      const result = fmt.format(testDate, DataType.TIMESTAMP);
      expect(result).toEqual(expected);
    });
  }); // format
});
