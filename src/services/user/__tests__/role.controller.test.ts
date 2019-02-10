import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { Role } from "../role.entity";

let app: Application;
let userId: string;
let userToken: string;
let adminId: string;
let adminToken: string;
let newRoleId: string;
let newPermissionId: string;

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
  const roleToRemove: Role = await connection.manager.findOne(Role, newRoleId);

  // only remove new roles if a test failed and they exist
  if (roleToRemove && roleToRemove.id !== "user" && roleToRemove.id !== "admin") {
    await connection.manager.delete(Role, roleToRemove);
  }
});

describe("Role", () => {
  describe("GET /roles", () => {
    it("allows user role access but without roles", async () => {
      const result = await request(app)
        .get("/roles")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data[0].permissions).toBeUndefined();
    });

    it("allows admin role access with roles", async () => {
      const result = await request(app)
        .get("/roles")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data[0].permissions).toBeDefined();
    });
  }); // GET /roles

  describe("GET /roles/:id", () => {
    it("allows user role access without roles", async () => {
      const result = await request(app)
        .get("/roles/guest")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data.permissions).toBeUndefined();
    });

    it("allows admin role access with roles", async () => {
      const result = await request(app)
        .get("/roles/guest")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data.permissions).toBeDefined();
    });
  }); // GET /roles:id

  describe("GET /roles/:id/permissions", () => {
    it("does not allow user role to view role permissions", async () => {
      const result = await request(app)
        .get(`/roles/user/permissions`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin role to view role permissions", async () => {
      const result = await request(app)
        .get(`/roles/user/permissions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /users/:id/roles

  describe("POST /roles", () => {
    const testData = {
      description: "Test role from automated tests",
      id: "test",
    };

    it("denies user role ability to create new roles", async () => {
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

    it("allows admin role to create new roles", async () => {
      const result = await request(app)
        .post("/roles")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newRoleId = result.body.data.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /roles

  describe("PUT /roles/:id", () => {
    const testData = {
      description: "Test role from automated tests (updated)",
      id: "test",
    };

    it("denies user role ability to update roles", async () => {
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

    it("allows admin role to update existing roles", async () => {
      const result = await request(app)
        .put(`/roles/${newRoleId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /roles

  describe("POST /roles/:id/permissions", () => {
    const testData = {
      action: "read: any",
      attributes: "*",
      resource: "user",
      role: newRoleId,
    };

    it("throws if missing data", async () => {
      const result = await request(app)
        .post(`/roles/${newRoleId}/permissions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to update role permissions", async () => {
      const result = await request(app)
        .post(`/roles/${newRoleId}/permissions`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newPermissionId = result.body.data.id;

      expect(result.status).toEqual(200);
      // TODO: query to confirm role has expected permission
    });
  }); // POST /roles/:id/permissions

  describe("DELETE /roles/:id/permissions/:permissionId", () => {
    it("denies user role to delete a role permission", async () => {
      const result = await request(app)
        .delete(`/roles/${newRoleId}/permissions/${newPermissionId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin to delete a role permission", async () => {
      const result = await request(app)
        .delete(`/roles/${newRoleId}/permissions/${newPermissionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      // TODO: check database to confirm role removed
    });
  });

  describe("DELETE /roles/:id", () => {
    it("denies user role ability to delete roles", async () => {
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

    it("allows admin role to delete existing roles", async () => {
      const result = await request(app)
        .delete(`/roles/${newRoleId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /roles/:id

});
