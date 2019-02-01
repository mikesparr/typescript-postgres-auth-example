import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Goal } from "../../goal/goal.entity";

let app: Application;
let userId: number | string;
let userToken: string;
let adminId: number | string;
let adminToken: string;
let newGoalId: number | string;

beforeAll(async () => {
  const connection: Connection = await getConnection();
  app = new App(controllers.map((controller) => new controller())).app;

  // log in test users and store tokens for testing
  const testUserData = {
    email: "user@example.com",
    password: "changeme",
  };
  const testAdminData = {
    email: "admin@example.com",
    password: "changeme",
  };

  const userLoginResult = await request(app)
    .post("/login")
    .send(testUserData)
    .set("Accept", "application/json");
  userToken = userLoginResult.body.token;
  userId = userLoginResult.body.user.id;

  const adminLoginResult = await request(app)
    .post("/login")
    .send(testAdminData)
    .set("Accept", "application/json");
  adminToken = adminLoginResult.body.token;
  adminId = adminLoginResult.body.user.id;
});

afterAll(async () => {
  // clean up test data
  const connection: Connection = await getConnection();
  const goalToRemove: Goal = await connection.manager.findOne(Goal, newGoalId);

  // only remove new goals if a test failed and they exist
  if (goalToRemove && goalToRemove.id !== 1) {
    await connection.manager.delete(Goal, goalToRemove);
  }
});

describe("Goal", () => {
  describe("GET /goals", () => {
    it("denies user goal access", async () => {
      const result = await request(app)
        .get("/goals")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin goal access with toggles", async () => {
      const result = await request(app)
        .get("/goals")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /goals

  describe("GET /goals/:id", () => {
    it("denies user goal access", async () => {
      const result = await request(app)
        .get("/goals/1")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin goal access with toggles", async () => {
      const result = await request(app)
        .get("/goals/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /goals:id

  describe("POST /goals", () => {
    const testData = {
      key: "test",
      name: "Test goal",
    };
    const testDataWithBadKey = {
      key: "test goal",
      name: "Test goal",
    };

    it("denies user ability to create new goals", async () => {
      const result = await request(app)
        .post("/goals")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/goals")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if adding space to key name", async () => {
      const result = await request(app)
        .post("/goals")
        .send(testDataWithBadKey)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newGoalId = result.body.id;

      expect(result.status).toEqual(400);
    });

    it("allows admin to create new goals", async () => {
      const result = await request(app)
        .post("/goals")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newGoalId = result.body.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /goals

  describe("PUT /goals/:id", () => {
    const testData = {
      key: "test",
      name: "Test goal (updated)",
    };

    it("denies user ability to update goals", async () => {
      const result = await request(app)
        .put(`/goals/${newGoalId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/goals/${newGoalId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin to update existing goals", async () => {
      const result = await request(app)
        .put(`/goals/${newGoalId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /goals

  describe("DELETE /goals/:id", () => {
    it("denies user ability to delete goals", async () => {
      const result = await request(app)
        .delete(`/goals/${newGoalId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/goals`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin to delete existing goals", async () => {
      const result = await request(app)
        .delete(`/goals/${newGoalId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /goals/:id

});
