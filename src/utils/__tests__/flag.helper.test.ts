import {
  inArray,
  evaluateRules,
  chooseWeightedValue,
  getVariantKeyAndGoalIds,
  getMergedGoalIds,
  getFlagsForUser,
} from "../flag.helper";

describe("flag.helper", () => {
  describe("inArray", () => {
    it("returns true if number found in number array", () => {
      const testList: number[] = [1, 2, 3, 4, 5];
      const targetNumber: number = 3;
      const result: boolean = inArray(testList, targetNumber);
      expect(result).toBeTruthy();
    });

    it("returns true if numberic string found in number array", () => {
      const testList: number[] = [1, 2, 3, 4, 5];
      const targetNumber: string = "3";
      const result: boolean = inArray(testList, targetNumber);
      expect(result).toBeTruthy();
    });

    it("returns false if number not found in number array", () => {
      const testList: number[] = [1, 2, 3, 4, 5];
      const targetNumber: number = 0;
      const result: boolean = inArray(testList, targetNumber);
      expect(result).toBeFalsy();
    });

    it("returns false if numeric string not found in number array", () => {
      const testList: number[] = [1, 2, 3, 4, 5];
      const targetNumber: string = "0";
      const result: boolean = inArray(testList, targetNumber);
      expect(result).toBeFalsy();
    });

    it("returns true if number found in string array", () => {
      const testList: string[] = ["1", "2", "3", "4", "5"];
      const targetNumber: number = 3;
      const result: boolean = inArray(testList, targetNumber);
      expect(result).toBeTruthy();
    });

    it("returns true if string found in string array", () => {
      const testList: string[] = ["1", "2", "3", "4", "5"];
      const targetNumber: string = "3";
      const result: boolean = inArray(testList, targetNumber);
      expect(result).toBeTruthy();
    });
  }); // inArray

  describe("evaluateRules", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  });

  describe("chooseWeightedValue", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  });

  describe("getVariantKeyAndGoalIds", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  });

  describe("getMergedGoalIds", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  });

  describe("getFlagsForUser", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  });
});
