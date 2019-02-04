import { User } from "../../services/user/user.entity";
import { Flag } from "../../services/flag/flag.entity";
import { Goal } from "../../services/goal/goal.entity";
import { Segment } from "../../services/segment/segment.entity";
import { Rule, RuleType } from "../../interfaces/rule.interface";
import IVariant from "../../interfaces/variant.interface";

import {
  inArray,
  evaluateRules,
  evaluateSegments,
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

  const testVariant1: {[key: string]: any} = {
    goalIds: ["goal-one"],
    key: "red.button",
    name: "Red button",
    weight: 30,
  };
  const testVariant2: {[key: string]: any} = {
    goalIds: ["goal-two"],
    key: "green.button",
    name: "Green button",
    weight: 70,
  };
  const testVariants: {[key: string]: any} = {
    ["red.button"]: testVariant1,
    ["green.button"]: testVariant2,
  };

  const testRule1: Rule[] = [
    {type: RuleType.FIELD, expression: 'country == "US"'},
    {type: RuleType.FIELD, expression: 'language == "en_US"'},
  ];
  const testRule2: Rule[] = [
    {type: RuleType.FIELD, expression: 'country == "US"'},
    {type: RuleType.FIELD, expression: 'language == "en_UK"'},
  ];
  const testRule3: Rule[] = [
    {type: RuleType.FIELD, expression: 'country == "CA"'},
    {type: RuleType.FIELD, expression: 'language == "fr_CA"'},
  ];

  const testSegment1: Segment = {
    id: 1,
    included: ["test@example.com"],
    key: "us-users",
    name: "US Users",
    rules: testRule1,
  };
  const testSegment2: Segment = {
    excluded: ["test@example.com"],
    id: 2,
    key: "canada-users",
    name: "French Canada Users",
    rules: testRule3,
  };

  const testUser: User = {
    country: "US",
    email: "test@example.com",
    firstName: "Test",
    id: 1,
    language: "en_US",
    lastName: "User",
  };
  const testUser2: User = {
    country: "US",
    email: "test2@example.com",
    firstName: "Test",
    id: 1,
    language: "en_US",
    lastName: "User",
  };
  const testUser3: User = {
    country: "CA",
    email: "test3@example.com",
    firstName: "Test",
    id: 1,
    language: "fr_CA",
    lastName: "User",
  };

  const testFlag1: Flag = {
    archived: false,
    enabled: false,
    id: 1,
    key: "greeting",
    name: "User greeting",
    segments: [testSegment1],
    temporary: true,
    variants: testVariants,
  };
  const testFlag2: Flag = {
    archived: false,
    enabled: false,
    id: 1,
    key: "holiday.greeting",
    name: "Holiday greeting",
    segments: [testSegment2],
    temporary: true,
    variants: null,
  };
  const testFlags: Flag[] = [testFlag1, testFlag2];

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
      const expected: {[key: string]: any} = {allTrue: true, anyTrue: true};
      const result: {[key: string]: any} = await evaluateRules(testRule1, testUser);
      expect(result).toEqual(expected);
    });

    it("returns someTrue if only one test passes", async () => {
      const expected: {[key: string]: any} = {allTrue: false, anyTrue: true};
      const result: {[key: string]: any} = await evaluateRules(testRule2, testUser);
      expect(result).toEqual(expected);
    });

    it("returns untrue if only no tests passes", async () => {
      const expected: {[key: string]: any} = {allTrue: false, anyTrue: false};
      const result: {[key: string]: any} = await evaluateRules(testRule3, testUser);
      expect(result).toEqual(expected);
    });
  }); // evaluateRules

  describe("evaluateSegments", () => {
    it("returns true if user fits in segments (included)", async () => {
      const result: boolean = await evaluateSegments(testUser, [testSegment1]);
      expect(result).toBeTruthy();
    });

    it("returns false if user not in segments (excluded)", async () => {
      const result: boolean = await evaluateSegments(testUser, [testSegment2]);
      expect(result).toBeFalsy();
    });

    it("returns true if user in segments (rules)", async () => {
      const result: boolean = await evaluateSegments(testUser2, [testSegment1]);
      expect(result).toBeTruthy();
    });

    it("returns false if user not in segments (rules)", async () => {
      const result: boolean = await evaluateSegments(testUser2, [testSegment2]);
      expect(result).toBeFalsy();
    });
  }); // evaluateSegments

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
    it("returns list of feature flag objects (user1)", async () => {
      const keyPool: string[] = ["red.button", "green.button"];
      const results: Array<{[key: string]: any}> = await getFlagsForUser(testUser, testFlags);
      expect(results.length).toEqual(1); // just just be flag 1 in segment 1
      expect(inArray(keyPool, results[0].key)).toBeTruthy(); // will be one of variant keys
    });

    it("returns list of feature flag objects (user3)", async () => {
      const results: Array<{[key: string]: any}> = await getFlagsForUser(testUser3, testFlags);
      expect(results.length).toEqual(1); // just just be flag 2 in segment 2
      expect(results[0].key).toEqual("holiday.greeting");
    });

    // TODO: add tests for targetEmails

    // TODO: add tests for environments

  }); // getFlagsForUser
});
