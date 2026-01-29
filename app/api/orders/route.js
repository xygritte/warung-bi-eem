import connectDB from "../../../lib/db";
import Order from "../../../models/Order";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Tambahan: Pastikan data selalu fresh (tidak di-cache)

// 1. GET: AMBIL DATA PESANAN (Untuk Admin & User)
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    let orders;
    if (ids) {
      // Jika user minta history spesifik
      const idArray = ids.split(",");
      orders = await Order.find({ _id: { $in: idArray } }).sort({ createdAt: -1 });
    } else {
      // Admin mengambil semua pesanan
      orders = await Order.find({}).sort({ createdAt: -1 });
    }
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error GET Orders:", error); // Cek terminal VS Code jika error lagi
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// 2. POST: BUAT PESANAN BARU (Checkout)
export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();
    
    // Hitung antrian sederhana
    const count = await Order.countDocuments(); 
    
    const newOrder = await Order.create({
      ...body,
      queueNumber: count + 1
    });

    return NextResponse.json({ message: "Berhasil", order: newOrder }, { status: 201 });
  } catch (error) {
    console.error("Error POST Order:", error);
    return NextResponse.json({ error: "Gagal simpan pesanan" }, { status: 500 });
  }
}

// 3. PUT: UPDATE STATUS / UPLOAD BUKTI BAYAR (Admin & User)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status, paymentProof } = body; 
    
    await connectDB();
    
    // Tentukan apa yang mau diupdate
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentProof) updateData.paymentProof = paymentProof;

    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Update berhasil", order: updatedOrder });
  } catch (error) {
    console.error("Error PUT Order:", error);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}