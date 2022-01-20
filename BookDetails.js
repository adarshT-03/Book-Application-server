const mongoose = require("mongoose");

const BookDetailSchema = new mongoose.Schema(
  {
    title: String,
    uploadedBy: String,
    author: String,
    image: String,
    pdf: String,
    category: String,
    description: String,
    views: String,
    date: String,
    status: { type: String, default: 0 },
    guestId: String,
    rating: String,
    ratingAdd: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    review: Array,
  },
  { collection: "BookDetails" }
);
mongoose.model("BookDetails", BookDetailSchema);
