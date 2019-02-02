import { User } from "../../services/user/user.entity";
import { Flag } from "../../services/flag/flag.entity";
import { Goal } from "../../services/goal/goal.entity";
import { Segment } from "../../services/segment/segment.entity";

import {
  inArray,
  evaluateRules,
  getVariantKeyAndGoalIds,
  getMergedGoalIds,
  getFlagsForUser,
} from "../flag.helper";

describe("flag.helper", () => {
  const testGoal1: Goal = {id: 1, key: "goal-one", name: "Goal One"};
  const testGoal2: Goal = {id: 2, key: "goal-two", name: "Goal Two"};
  const testGoal3: Goal = {id: 3, key: "goal-three", name: "Goal Three"};
  const testGoal4: Goal = {id: 4, key: "goal-four", name: "Goal Four"};
  const testGoal5: Goal = {id: 5, key: "goal-five", name: "Goal Five"};
  const testVariant1: {[key: string]: any} = {name: "Red button", weight: 30, goalIds: ["goal-one"]};
  const testVariant2: {[key: string]: any} = {name: "Green button", weight: 70, goalIds: ["goal-two"]};
  const testVariants: {[key: string]: any} = {
    ["red.button"]: testVariant1,
    ["green.button"]: testVariant2,
  };

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
    it("returns allTrue if tests pass", async () => {
      const testRules: Array<{[key: string]: any}> = [
        {type: "field", expression: "country == 'US'"},
        {type: "field", expression: "language == 'en_US'"},
      ];
      const testUser: User = {
        country: "US",
        email: "test@example.com",
        firstName: "Test",
        id: 1,
        language: "en_US",
        lastName: "User",
      };
      const expected: {[key: string]: any} = {allTrue: true, anyTrue: true};
      const result: {[key: string]: any} = await evaluateRules(testRules, testUser);
      expect(result).toEqual(expected);
    });

    it("returns someTrue if only one test passes", async () => {
      const testRules: Array<{[key: string]: any}> = [
        {type: "field", expression: "country == 'US'"},
        {type: "field", expression: "language == 'en_US'"},
      ];
      const testUser: User = {
        country: "US",
        email: "test@example.com",
        firstName: "Test",
        id: 1,
        language: "en_UK",
        lastName: "User",
      };
      const expected: {[key: string]: any} = {allTrue: false, anyTrue: true};
      const result: {[key: string]: any} = await evaluateRules(testRules, testUser);
      expect(result).toEqual(expected);
    });

    it("returns untrue if only no tests passes", async () => {
      const testRules: Array<{[key: string]: any}> = [
        {type: "field", expression: "country == 'CA'"},
        {type: "field", expression: "language == 'fr_CA'"},
      ];
      const testUser: User = {
        country: "US",
        email: "test@example.com",
        firstName: "Test",
        id: 1,
        language: "en_US",
        lastName: "User",
      };
      const expected: {[key: string]: any} = {allTrue: false, anyTrue: false};
      const result: {[key: string]: any} = await evaluateRules(testRules, testUser);
      expect(result).toEqual(expected);
    });
  }); // evaluateRules

  describe("getVariantKeyAndGoalIds", () => {
    it("returns variant based on weighted round robin", () => {
      const expectedPool: string[] = ["goal-one", "goal-two"];
      const result: {[key: string]: any} = getVariantKeyAndGoalIds(testVariants);
      expect(result.name).toBeDefined();
      expect(result.goalIds.length).toEqual(1);
      expect(inArray(expectedPool, result.goalIds[0])).toBeTruthy();
    });
  }); // getVariantKeyAndGoalIds

  describe("getMergedGoalIds", () => {
    it("returns empty array if no goals or variant Ids", () => {
      const testGoals: Goal[] = [];
      const testIds: string[] = null;
      const expected: string[] = [];
      const result: any[] = getMergedGoalIds(testGoals, testIds);
      expect(result).toEqual(expected);
    });

    it("returns only flag goal Ids if no variant ones", () => {
      const testGoals: Goal[] = [testGoal1, testGoal5];
      const testIds: string[] = null;
      const expected: string[] = ["goal-one", "goal-five"];
      const result: any[] = getMergedGoalIds(testGoals, testIds);
      expect(result).toEqual(expected);
    });

    it("returns only variant Ids if not goal ones", () => {
      const testGoals: Goal[] = null;
      const testIds: string[] = ["button-click-goal"];
      const expected: string[] = ["button-click-goal"];
      const result: any[] = getMergedGoalIds(testGoals, testIds);
      expect(result).toEqual(expected);
    });

    it("returns both goal and variant Ids", () => {
      const testGoals: Goal[] = [testGoal2, testGoal4];
      const testIds: string[] = ["button-click-goal"];
      const expected: string[] = ["goal-two", "goal-four", "button-click-goal"];
      const result: any[] = getMergedGoalIds(testGoals, testIds);
      expect(result).toEqual(expected);
    });
  }); // getMergedGoalIds

  describe("getFlagsForUser", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  }); // getFlagsForUser
});
