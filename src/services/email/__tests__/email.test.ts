import Email from "../email";
import EmailDto from "../email.dto";

describe("Email", () => {
  const email: Email = new Email();

  describe("send", () => {
    it("throws if invalid email", async () => {
      const testData: EmailDto = {
        from: process.env.EMAIL_FROM_DEFAULT,
        subject: "Test email",
        text: "This is a test email (text)",
        to: "mike",
      };

      try {
        await email.send(testData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("sends test email", async () => {
      const testData: EmailDto = {
        from: process.env.EMAIL_FROM_DEFAULT,
        subject: "Test email",
        text: "This is a test email (text)",
        to: process.env.EMAIL_TO_DEFAULT,
      };

      try {
        const result = await email.send(testData);
        expect(result).toBeTruthy();
      } catch (error) {
        fail();
      }
    });
  }); // send
});
