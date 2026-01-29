import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  notes: { type: String },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  queueNumber: { type: Number },
  items: Array,
  // TAMBAHAN BARU:
  paymentProof: { type: String }, // Akan berisi teks gambar (Base64)
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);