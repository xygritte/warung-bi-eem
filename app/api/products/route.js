import connectDB from "../../../lib/db";
import Product from "../../../models/Product";
import { NextResponse } from "next/server";

// GET: Ambil Menu
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ code: 1 });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// POST: Tambah Menu Baru
export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();
    const newProduct = await Product.create(body);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal tambah produk" }, { status: 500 });
  }
}

// DELETE: Hapus Menu
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    await connectDB();
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Produk dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus" }, { status: 500 });
  }
}