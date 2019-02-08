import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import App from "../../../app";

let app: Application;
let userId: string;
let userToken: string;
let adminId: string;
let adminToken: string;

describe("events", () => {
  beforeAll(async () => {
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

  describe("GET /events", () => {
    it("allows admin role to retrieve event records", async () => {
      const result = await request(app)
        .get("/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  });
});
