import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Relation } from "../relation.entity";
import logger from "../../../config/logger";

let app: Application;
let userId: string;
let userToken: string;
let adminId: string;
let adminToken: string;
const newRelationId: string = "notusedfornow";

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
  userToken = userLoginResult.body.data.token;
  userId = userLoginResult.body.data.user.id;

  const adminLoginResult = await request(app)
    .post("/login")
    .send(testAdminData)
    .set("Accept", "application/json");
  adminToken = adminLoginResult.body.data.token;
  adminId = adminLoginResult.body.data.user.id;
});

afterAll(async () => {
  // clean up test data
  const connection: Connection = await getConnection();
});

describe("relation", () => {
  describe("POST /relations", () => {
    const testData = {
      relation: "LIKES",
      sourceId: "abc123",
      sourceType: "user",
      targetId: "zyx987",
      targetType: "user",
    }; // hard-coded for now in Dao

    it("allows admin to create new relations", async () => {
      const result = await request(app)
        .post("/relations")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      // newRelationId = result.body.data.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /relations

  describe("GET /relations", () => {
    it("denies user relation access", async () => {
      const result = await request(app)
        .get("/relations")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin relation access with rules and goals", async () => {
      const result = await request(app)
        .get("/relations")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /relations
});
