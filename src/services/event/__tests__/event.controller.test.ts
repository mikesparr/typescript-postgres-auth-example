import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import App from "../../../app";

let app: Application;
let userId: string;
let userToken: string;
let adminId: string;
let adminToken: string;

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

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
    it ("sleeps to let event data populate", async () => {
      return await sleep(2500); // time for some records to be stored in ES
    });

    it("denies user role to retrieve event records", async () => {
      const result = await request(app)
        .get("/events")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin role to retrieve event records", async () => {
      const result = await request(app)
        .get("/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });

    it("returns 2 records based on size param", async () => {
      const result = await request(app)
        .get("/events?limit=2")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data.length).toEqual(2);
    });

    it("throws if no records found", async () => {
      const result = await request(app)
        .get("/events?q=actor.email:ilovezebras@zoo.com&limit=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404);
    });

    it("filters records based on q parameter", async () => {
      const result = await request(app)
        .get("/events?q=actor.email:admin@example.com&limit=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data.length).toEqual(1);
      expect(result.body.data[0].actor.email).toEqual("admin@example.com");
    });
  });
});
