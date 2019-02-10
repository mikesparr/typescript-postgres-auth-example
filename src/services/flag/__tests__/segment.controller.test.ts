import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Segment } from "../segment.entity";

let app: Application;
let userId: string;
let userToken: string;
let adminId: string;
let adminToken: string;
let newSegmentId: string;

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
  const segmentToRemove: Segment = await connection.manager.findOne(Segment, newSegmentId);

  // only remove new segments if a test failed and they exist
  if (segmentToRemove) {
    segmentToRemove.deleted = true;
    await connection.manager.save(Segment, segmentToRemove);
  }
});

describe("Segment", () => {
  describe("POST /segments", () => {
    const testData = {
      key: "test",
      name: "Test segment",
    };
    const testDataWithBadKey = {
      key: "test segment",
      name: "Test segment",
    };

    it("denies user ability to create new segments", async () => {
      const result = await request(app)
        .post("/segments")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/segments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if spaces in key name", async () => {
      const result = await request(app)
        .post("/segments")
        .send(testDataWithBadKey)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
      expect(result.body.errors.length).toEqual(1);
    });

    it("allows admin to create new segments", async () => {
      const result = await request(app)
        .post("/segments")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newSegmentId = result.body.data.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /segments

  describe("GET /segments", () => {
    it("denies user segment access", async () => {
      const result = await request(app)
        .get("/segments")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin segment access with toggles", async () => {
      const result = await request(app)
        .get("/segments")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /segments

  describe("GET /segments/:id", () => {
    it("denies user segment access", async () => {
      const result = await request(app)
        .get(`/segments/${newSegmentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin segment access with toggles", async () => {
      const result = await request(app)
        .get(`/segments/${newSegmentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /segments:id

  describe("PUT /segments/:id", () => {
    const testData = {
      key: "test",
      name: "Test segment (updated)",
    };

    it("denies user ability to update segments", async () => {
      const result = await request(app)
        .put(`/segments/${newSegmentId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/segments/${newSegmentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin to update existing segments", async () => {
      const result = await request(app)
        .put(`/segments/${newSegmentId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /segments

  describe("DELETE /segments/:id", () => {
    it("denies user ability to delete segments", async () => {
      const result = await request(app)
        .delete(`/segments/${newSegmentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/segments`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin to delete existing segments", async () => {
      const result = await request(app)
        .delete(`/segments/${newSegmentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /segments/:id

});
