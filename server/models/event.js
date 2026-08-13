import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: "" },
    venue: { type: String, default: "" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    registrationDeadline: { type: Date },
    totalSeats: { type: Number, default: 0 },
    registeredCount: { type: Number, default: 0 },
    entryFee: { type: Number, default: 0 },
    status: { type: String, default: "UPCOMING" }, // LIVE / ENDED / UPCOMING
    showWinner: { type: Boolean, default: false },
    winners: [
      {
        name: String,
        rank: Number,
      },
    ],
    club: {
      clubName: String,
      clubId: String,
    },
    createdBy: {
      clubName: String,
      userId: String,
    },
    sponsors: [
      {
        name: String,
        logoUrl: String,
        websiteUrl: String,
      },
    ],
    media: [
      {
        type: { type: String },
        url: String,
      },
    ],
    requiredFields: [String],
    customFields: [
      {
        label: String,
        type: String,
        required: Boolean,
        options: [String],
      },
    ],
    allowedPrograms: [{ type: String }],
    allowedYears: [{ type: String }],
    provideCertificate: { type: Boolean, default: false },
    registrations: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        externalEmail: { type: String, default: null },
        externalName: { type: String, default: null },
        status: { type: String, enum: ["REGISTERED", "WAITLISTED"], default: "REGISTERED" },
        formResponses: { type: mongoose.Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);