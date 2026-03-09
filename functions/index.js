const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const FEEDBACK_TO_EMAIL = process.env.FEEDBACK_TO_EMAIL || "harshilldrp62@gmail.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendFeedbackEmail = onDocumentCreated("feedback/{feedbackId}", async (event) => {
  const data = event.data?.data();
  if (!data) {
    logger.warn("Feedback trigger fired without document data.");
    return;
  }

  const message = String(data.message || "").trim();
  const userId = data.userId ? String(data.userId) : "anonymous";
  const appVersion = data.appVersion ? String(data.appVersion) : "unknown";
  const createdAt = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString();

  if (!message) {
    logger.warn("Skipping empty feedback message.", { feedbackId: event.params.feedbackId });
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: FEEDBACK_TO_EMAIL,
    subject: "FitTrack App Feedback",
    text: [
      "New feedback received from FitTrack app.",
      "",
      `Feedback ID: ${event.params.feedbackId}`,
      `User ID: ${userId}`,
      `App Version: ${appVersion}`,
      `Timestamp: ${createdAt}`,
      "",
      "Message:",
      message,
    ].join("\n"),
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("Feedback email sent.", { feedbackId: event.params.feedbackId });
  } catch (error) {
    logger.error("Failed to send feedback email.", error);
    throw error;
  }
});
