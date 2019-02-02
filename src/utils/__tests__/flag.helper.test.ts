import { User } from "../../services/user/user.entity";
import { Flag } from "../../services/flag/flag.entity";
import { Goal } from "../../services/goal/goal.entity";
import { Segment } from "../../services/segment/segment.entity";

import {
  inArray,
  evaluateRules,
  chooseWeightedValue,
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
  }); // evaluateRules

  describe("chooseWeightedValue", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  }); // chooseWeightedValue

  describe("getVariantKeyAndGoalIds", () => {
    it("fails", () => {
      expect(true).toBeTruthy();
    });
  }); // getVariantKeyAndGoalIds

  describe("getMergedGoalIds", () => {
    it("returns only flag goal Ids if no variant ones", () => {
      const testGoals: Goal[] = [testGoal1, testGoal5];
      const testIds: string[] = null;
      const expected: string[] = ["goal-one", "goal-five"];
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
