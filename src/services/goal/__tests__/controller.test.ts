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
  if (goalToRemove && goalToRemove.id !== "user" && goalToRemove.id !== "admin") {
    await connection.manager.delete(Goal, goalToRemove);
  }
});

describe("Goal", () => {
  describe("GET /goals", () => {
    it("allows user goal access but without permissions", async () => {
      const result = await request(app)
        .get("/goals")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body[0].permissions).toBeUndefined();
    });

    it("allows admin goal access with permissions", async () => {
      const result = await request(app)
        .get("/goals")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body[0].permissions).toBeDefined();
    });
  }); // GET /goals

  describe("GET /goals/:id", () => {
    it("allows user goal access without permissions", async () => {
      const result = await request(app)
        .get("/goals/guest")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.permissions).toBeUndefined();
    });

    it("allows admin goal access with permissions", async () => {
      const result = await request(app)
        .get("/goals/guest")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.permissions).toBeDefined();
    });
  }); // GET /goals:id

  describe("POST /goals", () => {
    const testData = {
      description: "Test goal from automated tests",
      id: "test",
    };

    it("denies user goal ability to create new permissions", async () => {
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

    it("allows admin goal to create new permissions", async () => {
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
      description: "Test goal from automated tests (updated)",
      id: "test",
    };

    it("denies user goal ability to update permissions", async () => {
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

    it("allows admin goal to update existing permissions", async () => {
      const result = await request(app)
        .put(`/goals/${newGoalId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /goals

  describe("DELETE /goals/:id", () => {
    it("denies user goal ability to delete permissions", async () => {
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

    it("allows admin goal to delete existing permissions", async () => {
      const result = await request(app)
        .delete(`/goals/${newGoalId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /goals/:id

});
