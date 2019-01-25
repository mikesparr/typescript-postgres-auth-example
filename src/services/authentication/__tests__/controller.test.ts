import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { User } from "../../user/user.entity";

let app: Application;
let testAuthToken: string;

beforeAll(async () => {
  const connection: Connection = await getConnection();
  app = new App(controllers.map((controller) => new controller())).app;
});

afterAll(async () => {
  // clean up test data
  const connection: Connection = await getConnection();
  const userToRemove: User = await connection.manager.findOne(User, { email: "sally@test.com" });
  await connection.manager.delete(User, userToRemove);
});

describe("Authentication", () => {
  describe("GET / - access denied", () => {
    it("Denies access to root path", async () => {
      const result = await request(app).get("/");
      expect(result.status).toEqual(401);
    });
  });

  describe("POST /register", () => {
    it("throws if no data provided", async () => {
      const result = await request(app)
        .post("/register")
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(400);
    });

    it("throws if incomplete data", async () => {
      const testData = {
        firstName: "Sally",
        lastName: "Tester",
      };

      const result = await request(app)
        .post("/register")
        .send(testData)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(400);
    });

    it("throws if data complete but email invalid", async () => {
      const testData = {
        firstName: "Sally", 
        lastName: "Tester", 
        email: "blahblah", 
        password: "changeme", 
        age: 40,
      };

      const result = await request(app)
        .post("/register")
        .send(testData)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(400);
    });

    it("creates a new user", async () => {
      const testData = {
        firstName: "Sally", 
        lastName: "Tester", 
        email: "sally@test.com", 
        password: "changeme", 
        age: 40,
      };

      const result = await request(app)
        .post("/register")
        .send(testData)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(200);
    });

    it("throws if user email already exists", async () => {
      const testData = {
        firstName: "Sally", 
        lastName: "Tester", 
        email: "sally@test.com", 
        password: "changeme", 
        age: 40,
      };

      const result = await request(app)
        .post("/register")
        .send(testData)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(400);
    });
  }); // POST /register

  describe("POST /login", () => {
    it("throws if missing data", async () => {
      const result = await request(app)
        .post("/login")
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(400);
    });

    it("throws if incomplete data", async () => {
      const testData = {
        email: "sally@test.com",
      };

      const result = await request(app)
        .post("/login")
        .send(testData)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(400);
    });

    it("throws authentication error if invalid password", async () => {
      const testData = {
        email: "sally@test.com",
        password: "iforgot",
      };

      const result = await request(app)
        .post("/login")
        .send(testData)
        .set("Accept", "application/json");
      
      expect(result.status).toEqual(401);
    });

    it("logs user in and returns token if valid email and password", async () => {
      const testData = {
        email: "sally@test.com",
        password: "changeme",
      };

      const result = await request(app)
        .post("/login")
        .send(testData)
        .set("Accept", "application/json");
      
      testAuthToken = result.body.token;
      
      expect(result.status).toEqual(200);
    });
  }); // POST /login

  describe("POST /logout", () => {
    it("logs user out and removes token from cache", async () => {
      const result = await request(app)
        .post("/logout")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .set("Accept", "application/json");
      
      // TODO: check cache record to confirm token removed
      
      expect(result.status).toEqual(200);
    });
  }); // POST /logout
});
