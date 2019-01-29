import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Permission } from "../../permission/permission.entity";

let app: Application;
let userId: number | string;
let userToken: string;
let adminId: number | string;
let adminToken: string;
let newPermissionId: number | string;

beforeAll(async () => {
  const connection: Connection = await getConnection();
  app = new App(controllers.map((controller) => new controller())).app;

  // log in test users and store tokens for testing
  const testUserData = {
    email: "user@test.com",
    password: "changeme",
  };
  const testAdminData = {
    email: "admin@test.com",
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
  const permissionToRemove: Permission = await connection.manager.findOne(Permission, newPermissionId);

  // only remove new permissions if a test failed and they exist
  if (permissionToRemove && permissionToRemove.id > 15) {
    await connection.manager.delete(Permission, permissionToRemove);
  }
});

describe("Permission", () => {
  describe("GET /permissions", () => {
    it("denies user role access", async () => {
      const result = await request(app)
        .get("/permissions")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin role access", async () => {
      const result = await request(app)
        .get("/permissions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /permissions

  describe("GET /permissions/:id", () => {
    it("denies user role access", async () => {
      const result = await request(app)
        .get("/permissions/2")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin role access", async () => {
      const result = await request(app)
        .get("/permissions/2")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /permissions:id

  describe("POST /permissions", () => {
    const testData = {
      action: "create:any",
      attributes: "*",
      resource: "test",
      role: "user",
    };

    it("denies user role ability to create new permissions", async () => {
      const result = await request(app)
        .post("/permissions")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/permissions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to create new permissions", async () => {
      const result = await request(app)
        .post("/permissions")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newPermissionId = result.body.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /permissions

  describe("PUT /permissions/:id", () => {
    const testData = {
      action: "read:any",
      attributes: "*, !id",
      resource: "test",
      role: "user",
    };

    it("denies user role ability to update permissions", async () => {
      const result = await request(app)
        .put(`/permissions/${newPermissionId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/permissions/${newPermissionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to update existing permissions", async () => {
      const result = await request(app)
        .put(`/permissions/${newPermissionId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /permissions

  describe("DELETE /permissions/:id", () => {
    it("denies user role ability to delete permissions", async () => {
      const result = await request(app)
        .delete(`/permissions/${newPermissionId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/permissions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin role to delete existing permissions", async () => {
      const result = await request(app)
        .delete(`/permissions/${newPermissionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /permissions/:id

});
