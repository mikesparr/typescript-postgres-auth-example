import mailer from "@sendgrid/mail";

mailer.setApiKey(process.env.SENDGRID_API_KEY);

export default mailer;
