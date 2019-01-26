import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { User } from "../../user/user.entity";

let app: Application;
let userId: number | string;
let userToken: string;
let adminId: number | string;
let adminToken: string;
let newUserId: number | string;

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
  const recordToRemove: User = await connection.manager.findOne(User, newUserId);

  // only remove new user if a test failed and they exist
  if (recordToRemove && recordToRemove.id > 3) {
    await connection.manager.delete(User, recordToRemove);
  }
});

describe("User", () => {
  describe("GET /users", () => {
    it("allows user role access but without age or password", async () => {
      const result = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body[0].age).toBeUndefined();
      expect(result.body[0].password).toBeUndefined();
    });

    it("allows admin role access with age but no password", async () => {
      const result = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body[0].age).toBeDefined();
      expect(result.body[0].password).toBeUndefined();
    });
  }); // GET /users

  describe("GET /users/:id", () => {
    it("allows user role access without age or password", async () => {
      const result = await request(app)
        .get("/users/1")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.age).toBeUndefined();
      expect(result.body.password).toBeUndefined();
    });

    it("allows admin role access with with age but no password", async () => {
      const result = await request(app)
        .get("/users/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.age).toBeDefined();
      expect(result.body.password).toBeUndefined();
    });
  }); // GET /users:id

  describe("POST /users", () => {
    const testData = {
      firstName: "Testy",
      lastName: "McTestface",
      age: 35,
      email: "test@test.com",
      password: "changeme",
    };

    it("denies user role ability to create new users", async () => {
      const result = await request(app)
        .post("/users")
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(403);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to create new users", async () => {
      const result = await request(app)
        .post("/users")
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");
      newUserId = result.body.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /users

  describe("PUT /users/:id", () => {
    const testData = {
      firstName: "Testy",
      lastName: "McTestface",
      age: 36,
      email: "test@test.com",
      password: "changeme",
    };

    it("denies user role ability to update users", async () => {
      const result = await request(app)
        .put(`/users/${newUserId}`)
        .send(testData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(403);
    });

    it("allows user role to edit their own user record", async () => {
      const myOwnData = {
        id: userId,
        firstName: "Basic",
        lastName: "User",
        email: "user@test.com",
        age: 21, // changed
      };

      const result = await request(app)
        .put(`/users/${userId}`)
        .send(myOwnData)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(200);
    });

    it("throws if missing data", async () => {
      const result = await request(app)
        .put(`/users/${newUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to update existing users", async () => {
      const result = await request(app)
        .put(`/users/${newUserId}`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // PUT /users

  describe("DELETE /users/:id", () => {
    it("denies user role ability to delete users", async () => {
      const result = await request(app)
        .delete(`/users/${newUserId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(403);
    });

    it("throws no record found if missing id", async () => {
      const result = await request(app)
        .delete(`/users`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(404); // no record found
    });

    it("allows admin role to delete existing users", async () => {
      const result = await request(app)
        .delete(`/users/${newUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // DELETE /users/:id

});
