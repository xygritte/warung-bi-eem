import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Contoh: MK01
  name: { type: String, required: true },
  category: { type: String, enum: ['food', 'beverage'], required: true },
  price: { type: Number, required: true },
  image: { type: String }
});

// Mencegah error compile ulang saat development
export default mongoose.models.Product || mongoose.model("Product", ProductSchema);