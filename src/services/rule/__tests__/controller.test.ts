import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Rule } from "../../rule/rule.entity";

let app: Application;
let userId: number | string;
let userToken: string;
let adminId: number | string;
let adminToken: string;
let newRuleId: number | string;

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
  const ruleToRemove: Rule = await connection.manager.findOne(Rule, newRuleId);

  // only remove new rules if a test failed and they exist
  if (ruleToRemove && ruleToRemove.id !== "user" && ruleToRemove.id !== "admin") {
    await connection.manager.delete(Rule, ruleToRemove);
  }
});

describe("Rule", () => {
  describe("GET /rules", () => {
    it("allows user rule access but without permissions", async () => {
      const result = await request(app)
        .get("/rules")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });

    it("allows admin rule access with permissions", async () => {
      const result = await request(app)
        .get("/rules")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /rules

  describe("GET /rules/:id", () => {
    it("allows user rule access without permissions", async () => {
      const result = await request(app)
        .get("/rules/guest")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });

    it("allows admin rule access with permissions", async () => {
      const result = await request(app)
        .get("/rules/guest")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /rules:id

  describe("POST /rules", () => {
    const testData = {
      id: "test",
      name: "Test rule",
    };

    it("denies user rule ability to create new permissions", async () => {
      const result = await request(app)
        .post("/rules")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/rules")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin rule to create new permissions", async () => {
      const result = await request(app)
        .post("/rules")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newRuleId = result.body.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /rules

  describe("PUT /rules/:id", () => {
    const testData = {
      id: "test",
      name: "Test rule (updated)",
    };

    it("denies user rule ability to update permissions", async () => {
      const result = await request(app)
        .put(`/rules/${newRuleId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/rules/${newRuleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin rule to update existing permissions", async () => {
      const result = await request(app)
        .put(`/rules/${newRuleId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /rules

  describe("DELETE /rules/:id", () => {
    it("denies user rule ability to delete permissions", async () => {
      const result = await request(app)
        .delete(`/rules/${newRuleId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/rules`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin rule to delete existing permissions", async () => {
      const result = await request(app)
        .delete(`/rules/${newRuleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /rules/:id

});
