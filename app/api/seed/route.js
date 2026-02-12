// Ganti tanda @ dengan titik-titik juga
import connectDB from "../../../lib/db";
import Product from "../../../models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    await Product.deleteMany({});

    return NextResponse.json({ message: "Sukses! Menu masuk.", data: menuAwal });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}