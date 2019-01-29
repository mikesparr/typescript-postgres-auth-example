import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Role } from "../../role/role.entity";

let app: Application;
let userId: number | string;
let userToken: string;
let adminId: number | string;
let adminToken: string;
let newRoleId: number | string;

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
  const roleToRemove: Role = await connection.manager.findOne(Role, newRoleId);

  // only remove new roles if a test failed and they exist
  if (roleToRemove && roleToRemove.id !== "user" && roleToRemove.id !== "admin") {
    await connection.manager.delete(Role, roleToRemove);
  }
});

describe("Role", () => {
  describe("GET /roles", () => {
    it("allows user role access but without permissions", async () => {
      const result = await request(app)
        .get("/roles")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body[0].permissions).toBeUndefined();
    });

    it("allows admin role access with permissions", async () => {
      const result = await request(app)
        .get("/roles")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body[0].permissions).toBeDefined();
    });
  }); // GET /roles

  describe("GET /roles/:id", () => {
    it("allows user role access without permissions", async () => {
      const result = await request(app)
        .get("/roles/guest")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.permissions).toBeUndefined();
    });

    it("allows admin role access with permissions", async () => {
      const result = await request(app)
        .get("/roles/guest")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.permissions).toBeDefined();
    });
  }); // GET /roles:id

  describe("POST /roles", () => {
    const testData = {
      description: "Test role from automated tests",
      id: "test",
    };

    it("denies user role ability to create new permissions", async () => {
      const result = await request(app)
        .post("/roles")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/roles")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to create new permissions", async () => {
      const result = await request(app)
        .post("/roles")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newRoleId = result.body.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /roles

  describe("PUT /roles/:id", () => {
    const testData = {
      description: "Test role from automated tests (updated)",
      id: "test",
    };

    it("denies user role ability to update permissions", async () => {
      const result = await request(app)
        .put(`/roles/${newRoleId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/roles/${newRoleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to update existing permissions", async () => {
      const result = await request(app)
        .put(`/roles/${newRoleId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /roles

  describe("DELETE /roles/:id", () => {
    it("denies user role ability to delete permissions", async () => {
      const result = await request(app)
        .delete(`/roles/${newRoleId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/roles`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin role to delete existing permissions", async () => {
      const result = await request(app)
        .delete(`/roles/${newRoleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /roles/:id

});
