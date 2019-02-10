import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Flag } from "../flag.entity";

let app: Application;
let userId: string;
let userToken: string;
let adminId: string;
let adminToken: string;
let newFlagId: string;

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
  const flagToRemove: Flag = await connection.manager.findOne(Flag, newFlagId);

  // only remove new flags if a test failed and they exist
  if (flagToRemove) {
    await connection.manager.delete(Flag, flagToRemove);
  }
});

describe("Flag", () => {
  describe("POST /flags", () => {
    const testData = {
      key: "test",
      name: "Test flag",
      type: "user",
    };

    const testDataWithBadKey = {
      key: "test flag",
      name: "Test flag",
      type: "user",
    };

    const testDataWithBadType = {
      key: "test",
      name: "Test flag",
      type: "American",
    };

    it("denies user ability to create new flags", async () => {
      const result = await request(app)
        .post("/flags")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/flags")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if key has spaces", async () => {
      const result = await request(app)
        .post("/flags")
        .send(testDataWithBadKey)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if type does not match enum values", async () => {
      const result = await request(app)
        .post("/flags")
        .send(testDataWithBadType)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin to create new flags", async () => {
      const result = await request(app)
        .post("/flags")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newFlagId = result.body.data.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /flags

  describe("GET /flags", () => {
    it("denies user flag access", async () => {
      const result = await request(app)
        .get("/flags")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin flag access with rules and goals", async () => {
      const result = await request(app)
        .get("/flags")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /flags

  describe("GET /flags/:id", () => {
    it("denies user flag access", async () => {
      const result = await request(app)
        .get(`/flags/${newFlagId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin flag access with rules and goals", async () => {
      const result = await request(app)
        .get(`/flags/${newFlagId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /flags:id

  describe("PUT /flags/:id", () => {
    const testData = {
      key: "test",
      name: "Test flag (updated)",
      type: "user",
    };

    it("denies user ability to update flags", async () => {
      const result = await request(app)
        .put(`/flags/${newFlagId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/flags/${newFlagId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin to update existing flags", async () => {
      const result = await request(app)
        .put(`/flags/${newFlagId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /flags

  describe("DELETE /flags/:id", () => {
    it("denies user ability to delete flags", async () => {
      const result = await request(app)
        .delete(`/flags/${newFlagId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/flags`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin to delete existing flags", async () => {
      const result = await request(app)
        .delete(`/flags/${newFlagId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /flags/:id

});
