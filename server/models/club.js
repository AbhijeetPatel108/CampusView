import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    clubName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "Student Club" },
    description: { type: String, default: "" },
    clubLogo: { type: String, default: "" },
    facultyName: { type: String, default: "" },
    facultyEmail: { type: String, default: "" },
    clubEmail: { type: String, default: "" },

    // Faculty advisors — array of { name, email }
    facultyCoordinators: [
      {
        name: { type: String },
        email: { type: String },
      },
    ],

    // Student lead names
    studentCoordinators: [{ type: String }],

    // Social / contact links
    socialLinks: [
      {
        platform: { type: String }, // instagram | linkedin | twitter | github | whatsapp | website
        url: { type: String },
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug from clubName before saving if not provided
clubSchema.pre("validate", function (next) {
  if (!this.slug && this.clubName) {
    this.slug = this.clubName
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export default mongoose.model("Club", clubSchema);
