import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

import { User } from "../user.entity";

let app: Application;
let userId: string;
let userToken: string;
let adminId: string;
let adminToken: string;
let newUserId: string;

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
  const recordToRemove: User = await connection.manager.findOne(User, newUserId);

  // only remove new user if a test failed and they exist
  if (recordToRemove) {
    await connection.manager.delete(User, recordToRemove);
  }
});

describe("User", () => {
  describe("POST /users", () => {
    const testData = {
      age: 30,
      avatar: "http://example.com/me/1234567.jpg",
      country: "US",
      email: "test@example.com",
      firstName: "Testy",
      ip: "FE80:0000:0000:0000:0202:B3FF:FE1E:8329", // V6
      language: "en_US",
      lastName: "McTestface",
      password: "changeme",
      timeZone: "America/Mountain",
    };
    const testDataWithTooShortCountry = {
      country: "E",
      email: "test@example.com",
      firstName: "Testy",
      lastName: "McTestface",
      password: "changeme",
    };
    const testDataWithTooLongCountry = {
      country: "America",
      email: "test@example.com",
      firstName: "Testy",
      lastName: "McTestface",
      password: "changeme",
    };
    const testDataWithInvalidAvatarURL = {
      avatar: "file\\mike/smil \.jpg",
      email: "test@example.com",
      firstName: "Testy",
      lastName: "McTestface",
      password: "changeme",
    };
    const testDataWithBadIPAddress = {
      email: "test@example.com",
      firstName: "Testy",
      ip: "555.555.555.55",
      lastName: "McTestface",
      password: "changeme",
    };
    const testDataWithTooShortPassword = {
      email: "test@example.com",
      firstName: "Testy",
      lastName: "McTestface",
      password: "oops",
    };
    const testDataWithPasswordWithSpaces = {
      email: "test@example.com",
      firstName: "Testy",
      lastName: "McTestface",
      password: "change me please",
    };
    const testDataWithTooLongPassword = {
      email: "test@example.com",
      firstName: "Testy",
      lastName: "McTestface",
      password: "thequickbrownfoxjumpsoverthelazydogthequickbrownfoxjumpsoverthelazydog",
    };
    const testDataWithInvalidLanguage = {
      email: "test@example.com",
      firstName: "Testy",
      ip: "555.555.555.55",
      language: "english",
      lastName: "McTestface",
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
      expect(result.body.errors.length).toEqual(1);
    });

    it("throws if invalid avatar URL", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithInvalidAvatarURL)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if bad IP address", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithBadIPAddress)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if country code too short", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithTooShortCountry)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if country code too long", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithTooLongCountry)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if langage invalid (en_US)", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithInvalidLanguage)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if password too short", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithTooShortPassword)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if password too long", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithTooLongPassword)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("throws if password has spaces", async () => {
      const result = await request(app)
        .post("/users")
        .send(testDataWithPasswordWithSpaces)
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
      newUserId = result.body.data.id;

      expect(result.status).toEqual(200);
    });
  }); // POST /users

  describe("POST /users/:id/roles", () => {
    const testData = {
      id: "user",
    };

    it("throws if missing data", async () => {
      const result = await request(app)
        .post(`/users/${newUserId}/roles`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(400);
    });

    it("allows admin role to update user roles", async () => {
      const result = await request(app)
        .post(`/users/${newUserId}/roles`)
        .send(testData)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      // TODO: query to confirm user has expected role
    });
  }); // POST /users/:id/roles

  describe("GET /users", () => {
    it("allows user role access but without age or password", async () => {
      const result = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data[0].age).toBeUndefined();
      expect(result.body.data[0].password).toBeUndefined();
    });

    it("allows admin role access with age but no password", async () => {
      const result = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data[0].age).toBeDefined();
      expect(result.body.data[0].password).toBeUndefined();
    });
  }); // GET /users

  describe("GET /users/:id", () => {
    it("allows user role access without age or password", async () => {
      const result = await request(app)
        .get(`/users/${newUserId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data.age).toBeUndefined();
      expect(result.body.data.password).toBeUndefined();
    });

    it("allows admin role access with with age but no password", async () => {
      const result = await request(app)
        .get(`/users/${newUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      expect(result.body.data.age).toBeDefined();
      expect(result.body.data.password).toBeUndefined();
    });
  }); // GET /users/:id

  describe("GET /users/:id/roles", () => {
    it("does not allow user role to view other users roles", async () => {
      const result = await request(app)
        .get(`/users/${adminId}/roles`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin role to view other user roles", async () => {
      const result = await request(app)
        .get(`/users/${userId}/roles`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /users/:id/roles

  describe("GET /users/:id/tokens", () => {
    it("does not allow user role to view other users tokens", async () => {
      const result = await request(app)
        .get(`/users/${adminId}/tokens`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows user role to view their own tokens", async () => {
      const result = await request(app)
        .get(`/users/${userId}/tokens`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });

    it("allows admin role to view other user tokens", async () => {
      const result = await request(app)
        .get(`/users/${userId}/tokens`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /users/:id/tokens

  describe("GET /users/:id/flags", () => {
    it("does not allow user to view other users flags", async () => {
      const result = await request(app)
        .get(`/users/${adminId}/flags`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows user role to view their own flags", async () => {
      const result = await request(app)
        .get(`/users/${userId}/flags`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });

    it("allows admin role to view other user flags", async () => {
      const result = await request(app)
        .get(`/users/${userId}/flags`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });
  }); // GET /users/:id/flags

  describe("PUT /users/:id", () => {
    const testData = {
      email: "test@example.com",
      firstName: "Testy",
      ip: "FE80::0202:B3FF:FE1E:8329", // collapsed IPV6 format
      lastName: "McTestface",
      password: "thanks4changingMe",
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
        age: 21, // changed
        email: "user@example.com",
        firstName: "Basic",
        id: userId,
        lastName: "User",
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

  describe("DELETE /users/:id/tokens", () => {
    it("denies user role ability to add user tokens to deny list", async () => {
      const result = await request(app)
        .delete(`/users/${newUserId}/tokens`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin to delete tokens and add them to deny list", async () => {
      const result = await request(app)
        .delete(`/users/${newUserId}/tokens`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      // TODO: check cache to confirm token added to deny list
    });
  });

  describe("DELETE /users/:id/roles/:roleId", () => {
    it("denies user role to delete another user role", async () => {
      const result = await request(app)
        .delete(`/users/${adminId}/roles/1`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows admin to delete another user role", async () => {
      const result = await request(app)
        .delete(`/users/${userId}/roles/1`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      // TODO: check database to confirm role removed
    });
  });

  describe("DELETE /users/:id/tokens/:tokenId", () => {
    it("denies user role to delete another user token", async () => {
      const result = await request(app)
        .delete(`/users/${adminId}/tokens/${adminToken}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(403);
    });

    it("allows user role to delete their own token (device)", async () => {
      const result = await request(app)
        .delete(`/users/${userId}/tokens/${userToken}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
    });

    it("allows admin to delete token by id and add them to deny list", async () => {
      const result = await request(app)
        .delete(`/users/${userId}/tokens/${userToken}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Accept", "application/json");

      expect(result.status).toEqual(200);
      // TODO: check cache to confirm token added to deny list
    });
  });

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
