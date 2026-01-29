"use client";
import { useState, useEffect } from "react";
import "./admin.css"; // Import CSS Admin

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Form Produk
  const [newProduct, setNewProduct] = useState({ code: "", name: "", price: "", category: "food" });

  // === 1. LOAD DATA ===
  useEffect(() => {
    fetchOrders();
    fetchProducts();

    // Auto Refresh setiap 5 detik (seperti admin lama Anda)
    const interval = setInterval(() => {
      if (activeTab === "orders") fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) { console.error(err); }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) { console.error(err); }
  }

  // === 2. ORDER ACTIONS ===
  async function updateOrderStatus(id, newStatus) {
    if (!confirm(`Ubah status jadi ${newStatus}?`)) return;
    setLoading(true);
    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchOrders(); // Refresh data
    } catch (error) {
      alert("Gagal update status");
    } finally {
      setLoading(false);
    }
  }

  // Helper: Format Rupiah
  const formatRupiah = (n) => "Rp " + n.toLocaleString("id-ID");

  // Helper: Hitung Statistik
  const stats = {
    totalSales: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
  };

  // === 3. PRODUCT ACTIONS ===
  async function handleAddProduct(e) {
    e.preventDefault();
    if (!newProduct.code || !newProduct.name) return alert("Lengkapi data!");
    
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      alert("Produk berhasil ditambah!");
      setNewProduct({ code: "", name: "", price: "", category: "food" });
      fetchProducts();
    } catch (error) {
      alert("Gagal tambah produk");
    }
  }

  async function handleDeleteProduct(id) {
    if(!confirm("Hapus produk ini?")) return;
    try {
      await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      fetchProducts();
    } catch(e) { alert("Gagal hapus"); }
  }

  return (
    <div className="admin-container">
      {/* HEADER */}
      <header className="header">
        <div className="header-container">
            <h1>🏪 Admin Warung Bi Eem</h1>
            <div style={{fontSize:'0.9rem'}}>🔄 Auto-Refresh On</div>
        </div>
      </header>

      {/* TABS */}
      <nav className="tabs">
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📋 Pesanan & Antrian</button>
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 Kelola Produk</button>
      </nav>

      <main className="container">
        
        {/* === TAB PESANAN === */}
        {activeTab === "orders" && (
          <div className="page active">
             {/* STATISTIK */}
             <div className="stats-grid" style={{marginBottom: '20px'}}>
                <div className="stat-item">
                    <span className="stat-label">Pendapatan (Selesai)</span>
                    <span className="stat-value" style={{color: 'green'}}>{formatRupiah(stats.totalSales)}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Pending</span>
                    <span className="stat-value">{stats.pending}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Antrian (Confirmed)</span>
                    <span className="stat-value">{stats.confirmed}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Diproses</span>
                    <span className="stat-value" style={{color: 'orange'}}>{stats.processing}</span>
                </div>
             </div>

             {/* TABEL PESANAN */}
             <div className="card">
                <h2 className="section-title">Daftar Pesanan Masuk</h2>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Antrian</th>
                                <th>Customer</th>
                                <th>Menu</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? <tr><td colSpan="6" align="center">Belum ada pesanan</td></tr> : 
                            orders.map((order) => (
                                <tr key={order._id} style={{opacity: order.status === 'cancelled' ? 0.5 : 1}}>
                                    <td><span style={{fontWeight:'bold', fontSize:'1.2em'}}>#{order.queueNumber || '-'}</span></td>
                                    <td>
                                        <div style={{fontWeight:'bold'}}>{order.customerName}</div>
                                        <div style={{fontSize:'0.8em', color:'#666'}}>{new Date(order.createdAt).toLocaleTimeString()}</div>
                                        
                                        {/* TAMPILKAN TOMBOL BUKTI BAYAR */}
                                        {order.paymentProof && (
                                        <button 
                                            onClick={() => {
                                                // Buka gambar di jendela baru / popup sederhana
                                                const w = window.open("");
                                                w.document.write(`<img src="${order.paymentProof}" style="width:100%">`);
                                            }}
                                            style={{fontSize:'0.7em', marginTop:'5px', background:'purple', color:'white', border:'none', padding:'3px 6px', borderRadius:'4px', cursor:'pointer'}}
                                        >
                                            📸 Cek Bukti Bayar
                                        </button>
                                        )}
                                    </td>
                                    <td>
                                        <ul style={{listStyle:'none', padding:0, fontSize:'0.9em'}}>
                                            {order.items.map((item, idx) => (
                                                <li key={idx}>{item.qty}x {item.productName}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>{formatRupiah(order.total)}</td>
                                    <td>
                                        <span className={`status-tag status-${order.status}`}>{order.status}</span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {order.status === 'pending' && (
                                                <>
                                                <button className="btn btn-success" onClick={() => updateOrderStatus(order._id, 'confirmed')}>✅ Terima</button>
                                                <button className="btn btn-danger" onClick={() => updateOrderStatus(order._id, 'cancelled')}>❌ Tolak</button>
                                                </>
                                            )}
                                            {order.status === 'confirmed' && (
                                                <button className="btn btn-info" onClick={() => updateOrderStatus(order._id, 'processing')}>🍳 Masak</button>
                                            )}
                                            {order.status === 'processing' && (
                                                <button className="btn btn-success" onClick={() => updateOrderStatus(order._id, 'completed')}>🏁 Selesai</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
        )}

        {/* === TAB PRODUK === */}
        {activeTab === "products" && (
            <div className="page active">
                <div className="product-layout">
                    {/* FORM TAMBAH */}
                    <div className="card">
                        <h2 className="section-title">Tambah Menu Baru</h2>
                        <form onSubmit={handleAddProduct}>
                            <div className="form-group">
                                <label>Kode</label>
                                <input type="text" value={newProduct.code} onChange={e=>setNewProduct({...newProduct, code: e.target.value})} placeholder="Misal: MK05" className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Nama</label>
                                <input type="text" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} placeholder="Nama Makanan" className="form-input" />
                            </div>
                            <div className="form-group">
                                <label>Kategori</label>
                                <select value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})} className="form-input">
                                    <option value="food">Makanan</option>
                                    <option value="beverage">Minuman</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Harga</label>
                                <input type="number" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} className="form-input" />
                            </div>
                            <button type="submit" className="btn btn-success" style={{width:'100%', marginTop:'10px'}}>➕ Simpan Menu</button>
                        </form>
                    </div>

                    {/* LIST PRODUK */}
                    <div className="card">
                        <h2 className="section-title">Daftar Menu</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama</th>
                                    <th>Harga</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.code}</td>
                                        <td>{p.name} <span style={{fontSize:'0.8em', color:'#888'}}>({p.category})</span></td>
                                        <td>{formatRupiah(p.price)}</td>
                                        <td>
                                            <button className="btn btn-danger" style={{padding:'5px'}} onClick={() => handleDeleteProduct(p._id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {loading && <div className="loading-overlay active"><div className="spinner"></div></div>}
    </div>
  );
}