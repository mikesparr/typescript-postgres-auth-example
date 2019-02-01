import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Toggle } from "../../toggle/toggle.entity";

let app: Application;
let userId: number | string;
let userToken: string;
let adminId: number | string;
let adminToken: string;
let newToggleId: number | string;

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
  const toggleToRemove: Toggle = await connection.manager.findOne(Toggle, newToggleId);

  // only remove new toggles if a test failed and they exist
  if (toggleToRemove && toggleToRemove.id !== 1) {
    await connection.manager.delete(Toggle, toggleToRemove);
  }
});

describe("Toggle", () => {
  describe("GET /toggles", () => {
    it("denies user toggle access", async () => {
      const result = await request(app)
        .get("/toggles")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin toggle access with rules and goals", async () => {
      const result = await request(app)
        .get("/toggles")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /toggles

  describe("GET /toggles/:id", () => {
    it("denies user toggle access", async () => {
      const result = await request(app)
        .get("/toggles/1")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin toggle access with rules and goals", async () => {
      const result = await request(app)
        .get("/toggles/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /toggles:id

  describe("POST /toggles", () => {
    const testData = {
      key: "test",
      name: "Test toggle",
      type: "user",
    };

    it("denies user ability to create new toggles", async () => {
      const result = await request(app)
        .post("/toggles")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/toggles")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin to create new toggles", async () => {
      const result = await request(app)
        .post("/toggles")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newToggleId = result.body.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /toggles

  describe("PUT /toggles/:id", () => {
    const testData = {
      key: "test",
      name: "Test toggle (updated)",
      type: "user",
    };

    it("denies user ability to update toggles", async () => {
      const result = await request(app)
        .put(`/toggles/${newToggleId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/toggles/${newToggleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin to update existing toggles", async () => {
      const result = await request(app)
        .put(`/toggles/${newToggleId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /toggles

  describe("DELETE /toggles/:id", () => {
    it("denies user ability to delete toggles", async () => {
      const result = await request(app)
        .delete(`/toggles/${newToggleId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/toggles`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin to delete existing toggles", async () => {
      const result = await request(app)
        .delete(`/toggles/${newToggleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /toggles/:id

});
