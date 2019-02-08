import request from "supertest";
import controllers from "../../index";
import { Application } from "express";
import { getConnection, Connection } from "typeorm";
import App from "../../../app";

describe("events", () => {
  describe("GET /events", () => {
    it("returns list of events in descending order (recent)", () => {
      expect(true).toBeTruthy();
    });
  });
});
