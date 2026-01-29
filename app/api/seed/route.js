// Ganti tanda @ dengan titik-titik juga
import connectDB from "../../../lib/db";
import Product from "../../../models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    
    // Data Menu
    const menuAwal = [
      { code: "MK01", name: "Nasi Goreng Spesial", category: "food", price: 15000 },
      { code: "MK02", name: "Mie Goreng Telur", category: "food", price: 12000 },
      { code: "MK03", name: "Ayam Geprek", category: "food", price: 18000 },
      { code: "MN01", name: "Es Teh Manis", category: "beverage", price: 5000 },
      { code: "MN02", name: "Kopi Hitam", category: "beverage", price: 4000 },
      { code: "MN03", name: "Es Jeruk", category: "beverage", price: 6000 },
    ];

    await Product.deleteMany({});
    await Product.insertMany(menuAwal);

    return NextResponse.json({ message: "Sukses! Menu masuk.", data: menuAwal });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}