import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

let app: Application;
let userId: string;
let userToken: string;

beforeAll(async () => {
  const connection: Connection = await getConnection();
  app = new App(controllers.map((controller) => new controller())).app;

  // log in test users and store tokens for testing
  const testUserData = {
    email: "user@example.com",
    password: "changeme",
  };

  const userLoginResult = await request(app)
    .post("/login")
    .send(testUserData)
    .set("Accept", "application/json");
  userToken = userLoginResult.body.data.token;
  userId = userLoginResult.body.data.user.id;
});

afterAll(async () => {
  // clean up test data
  const connection: Connection = await getConnection();
});

describe("Search", () => {
  describe("GET /search", () => {
    it("allows user search geo data", async () => {
      const result = await request(app)
        .get("/search?q=Missoula")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /search

});
