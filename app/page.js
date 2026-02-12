"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  // === STATE (Data Aplikasi) ===
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [activePage, setActivePage] = useState("home"); // home, cart, history, queue
  
  // State Checkout
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // State History & Queue
  const [historyOrders, setHistoryOrders] = useState([]);
  const [queueList, setQueueList] = useState([]);

  // === 1. LOAD DATA AWAL ===
  useEffect(() => {
    fetchProducts();
    // Cek LocalStorage untuk History saat pertama buka
    const savedIds = JSON.parse(localStorage.getItem("warungBiEemOrderIds") || "[]");
    
    // PERBAIKAN: Hanya panggil fetchHistory jika benar-benar ada ID tersimpan
    if (savedIds.length > 0) {
        fetchHistory(savedIds);
    }
  }, []);

  // Update Queue setiap kali masuk halaman antrian
  useEffect(() => {
    if (activePage === "queue") fetchQueue();
  }, [activePage]);

  // === 2. FUNGSI API ===
  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Gagal ambil menu:", error);
      setLoading(false);
    }
  }

  // === PERBAIKAN UTAMA DI SINI ===
  async function fetchHistory(ids) {
    // PENGAMAN: Jika tidak ada ID (array kosong), jangan panggil API.
    // Ini mencegah API mengembalikan "Semua Pesanan" secara tidak sengaja.
    if (!ids || ids.length === 0) {
        setHistoryOrders([]);
        return;
    }

    try {
      // Panggil API dengan parameter ID spesifik
      const res = await fetch(`/api/orders?ids=${ids.join(",")}`);
      const data = await res.json();
      
      // Pastikan data yang diterima berupa Array
      setHistoryOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal ambil history:", error);
    }
  }

  async function fetchQueue() {
    try {
      const res = await fetch("/api/orders"); // Ambil semua antrian aktif (API default ambil semua)
      const data = await res.json();
      setQueueList(data);
    } catch (error) {
      console.error("Gagal ambil antrian:", error);
    }
  }

  // === 3. LOGIKA CART & CHECKOUT ===
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.code === product.code);
      if (existing) {
        return prev.map((item) =>
          item.code === product.code
            ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price }
            : item
        );
      }
      return [...prev, { ...product, qty: 1, total: product.price }];
    });
    // Haptic feedback sederhana
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const processCheckout = async () => {
    if (!customerName.trim()) return alert("Masukkan nama pemesan!");
    if (cart.length === 0) return alert("Keranjang kosong!");

    setIsProcessing(true);

    const orderData = {
      customerName,
      notes,
      items: cart.map(item => ({
        productCode: item.code,
        productName: item.name,
        price: item.price,
        qty: item.qty,
        total: item.total
      })),
      total: cart.reduce((a, b) => a + b.total, 0),
      status: "pending"
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ Pesanan Berhasil! Nomor Antrian: #${result.order.queueNumber} \nSilakan lakukan pembayaran dan mengirim bukti bayar melalui halaman riwayat pesanan.`);
        
        // Simpan ID ke LocalStorage (Kunci Privasi User)
        const currentIds = JSON.parse(localStorage.getItem("warungBiEemOrderIds") || "[]");
        const newIds = [...currentIds, result.order._id];
        localStorage.setItem("warungBiEemOrderIds", JSON.stringify(newIds));

        // Reset
        setCart([]);
        setCustomerName("");
        setNotes("");
        
        // Pindah ke History & Refresh datanya dengan ID baru
        fetchHistory(newIds);
        setActivePage("history");
      } else {
        alert("❌ Gagal mengirim pesanan.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsProcessing(false);
    }
  };

  // === 4. HELPER ===
  const formatRupiah = (n) => "Rp " + n.toLocaleString("id-ID");
  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Filter Menu
  const filteredProducts = products.filter((p) => {
    if (category === "all") return true;
    return p.category === category;
  });

  if (loading) return (
    <div className="splash-screen">
       <h1 className="splash-title">Warung Bi Eem</h1>
       <div className="loading-bar"><div className="loading-progress"></div></div>
    </div>
  );

  return (
    <div className="container">
      
      {/* === HALAMAN MENU (HOME) === */}
      {activePage === "home" && (
        <div className="page active">
          <div className="header"><h1 className="header-title">Warung Bi Eem</h1></div>
          <div className="categories">
            {["all", "food", "beverage"].map((cat) => (
              <button key={cat} 
                className={`category-btn ${category === cat ? "active" : ""}`} 
                onClick={() => setCategory(cat)}>
                {cat === "all" ? "Semua" : cat === "food" ? "Makanan" : "Minuman"}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filteredProducts.map((item) => (
              <div key={item._id || item.code} className="menu-item">
                <div className="menu-image">{item.category === "food" ? "🍔" : "🥤"}</div>
                <div className="menu-info">
                  <div className="menu-name">{item.name}</div>
                  <div className="menu-desc">{item.category === "food" ? "Makanan" : "Minuman"}</div>
                  <div className="menu-price">{formatRupiah(item.price)}</div>
                  <button className="add-btn" onClick={() => addToCart(item)}>+ Tambah</button>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
             <div className="order-now-btn">
                <button className="btn btn-primary" onClick={() => setActivePage("cart")}>
                  Lihat Keranjang ({totalItems}) - {formatRupiah(grandTotal)}
                </button>
             </div>
          )}
        </div>
      )}

      {/* === HALAMAN CART (ORDERS PAGE) === */}
      {activePage === "cart" && (
        <div className="page active">
          <div className="header"><h1 className="header-title">Konfirmasi</h1></div>
          <div className="order-summary">
            {cart.length === 0 ? <p className="text-center">Keranjang Kosong</p> : 
            cart.map((item) => (
              <div key={item.code} className="order-item">
                <div className="order-item-info">
                  <div className="order-item-name">{item.name}</div>
                  <div className="order-item-details">{item.qty} x {formatRupiah(item.price)}</div>
                </div>
                <div>{formatRupiah(item.total)}</div>
              </div>
            ))}
            
            <div className="order-total">
              <span>Total:</span> <span className="total-amount">{formatRupiah(grandTotal)}</span>
            </div>

            <div className="form-group" style={{marginTop:'20px'}}>
                <label className="form-label">Nama Pemesan</label>
                <input type="text" className="form-input" placeholder="Nama Anda" 
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            

            <button className="btn btn-primary" onClick={processCheckout} disabled={isProcessing}>
              {isProcessing ? "Memproses..." : "Konfirmasi Pesanan"}
            </button>
            <button className="btn btn-secondary" style={{marginTop:'10px'}} onClick={() => setActivePage("home")}>
              &larr; Tambah Menu Lagi
            </button>
          </div>
        </div>
      )}

      {/* === HALAMAN QUEUE (ANTRIAN) === */}
      {activePage === "queue" && (
        <div className="page active">
          <div className="header"><h1 className="header-title">Status Antrian</h1></div>
          <div className="queue-container">
              <div className="current-queue-section">
                  <h3 className="queue-title">Sedang Diproses</h3>
                  {/* Ambil antrian pertama yang statusnya processing */}
                  <div className="current-queue-number">
                    {queueList.find(q => q.status === 'processing')?.queueNumber || '-'}
                  </div>
              </div>
              <button className="btn btn-primary" onClick={fetchQueue} style={{marginTop: '20px'}}>🔄 Refresh</button>
              
              <h3 className="queue-title" style={{marginTop: '20px'}}>Daftar Menunggu</h3>
              <div className="queue-list">
                {queueList.length === 0 ? <p className="text-center">Belum ada antrian.</p> : 
                 queueList.map((q) => (
                  <div key={q._id} className={`queue-item ${q.status === 'processing' ? 'current' : ''}`}>
                      <span className="queue-item-number">#{q.queueNumber || '?'}</span>
                      <span className="queue-item-customer">{q.customerName}</span>
                      <span className={`status-tag status-${q.status}`}>{q.status}</span>
                  </div>
                ))}
              </div>
          </div>
        </div>
      )}

      {/* === HALAMAN HISTORY === */}
      {activePage === "history" && (
        <div className="page active">
            <div className="header"><h1 className="header-title">Riwayat Pesanan</h1></div>
            <Image src="/qris.jpg" alt="QRIS" width={200} height={200} style={{width: '40%', height: 'auto', display: 'block', margin: '10px auto', borderRadius: '10px'}} />

            <p className="page-subtitle" style={{textAlign: 'center'}}>Silakan transfer & upload bukti bayar</p>
            
            <button className="btn btn-secondary mb-4 mt-4" onClick={() => {
              const savedIds = JSON.parse(localStorage.getItem("warungBiEemOrderIds") || "[]");
              fetchHistory(savedIds);
            }}>🔄 Refresh Status</button>

            <div id="history-list-container" className="text-center mt-4">
              {historyOrders.length === 0 ? <p className="text-center mt-4">Belum ada riwayat pesanan Anda.</p> : 
              historyOrders.map((order) => (
                <div key={order._id} className="history-group">
                    <div className="history-group-header">
                        <div className="history-date">{new Date(order.createdAt).toLocaleString()}</div>
                        <div className="history-customer">
                          {order.customerName} 
                          {order.queueNumber && <span className="status-tag" style={{marginLeft:5}}>#{order.queueNumber}</span>}
                        </div>
                        <div className={`history-status status-${order.status}`}>{order.status}</div>
                    </div>
                    
                    <div style={{padding: '0 15px'}}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="history-item">
                          <div>{item.productName} ({item.qty}x)</div>
                          <div>{formatRupiah(item.total)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="history-total">Total: {formatRupiah(order.total)}</div>

                    {/* FITUR UPLOAD BUKTI (Hanya muncul jika status Pending) */}
                    {order.status === 'pending' && (
                      <div style={{padding: '15px', background: '#f9f9f9', borderTop: '1px solid #eee'}}>
                        {order.paymentProof ? (
                          <div style={{color: 'green', fontSize: '0.9em', textAlign:'center'}}>
                            ✅ Bukti Pembayaran Terkirim
                          </div>
                        ) : (
                          <div style={{background:'#fff', padding:'10px', borderRadius:'5px', boxShadow:'0 0 5px rgba(0,0,0,0.1)'}}>
                            <label style={{display:'block', marginBottom:'5px', fontSize:'0.9em'}}>Upload Bukti Transfer:</label>
                            <input style={{background: '#1aff00'}} type="file" accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if(!file) return;
                                
                                // Convert gambar ke text (Base64)
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = async () => {
                                  const base64Image = reader.result;
                                  // Kirim ke API
                                  try {
                                    const res = await fetch("/api/orders", {
                                      method: "PUT",
                                      headers: {"Content-Type": "application/json"},
                                      body: JSON.stringify({ id: order._id, paymentProof: base64Image })
                                    });
                                    if(res.ok) {
                                      alert("Bukti berhasil diupload!");
                                      const ids = JSON.parse(localStorage.getItem("warungBiEemOrderIds") || "[]");
                                      fetchHistory(ids);
                                    }
                                  } catch { alert("Gagal upload"); }
                                };
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
        </div>
      )}

      {/* === BOTTOM NAV === */}
      <div className="bottom-nav">
        <div className={`nav-item ${activePage === "home" ? "active" : ""}`} onClick={() => setActivePage("home")}>
          <div className="nav-icon">🏠</div><span>Home</span>
        </div>
        <div className={`nav-item ${activePage === "cart" ? "active" : ""}`} onClick={() => setActivePage("cart")}>
          <div className="nav-icon">🛒</div><span>Cart</span>
          {totalItems > 0 && <div className="cart-badge">{totalItems}</div>}
        </div>
        <div className={`nav-item ${activePage === "queue" ? "active" : ""}`} onClick={() => setActivePage("queue")}>
          <div className="nav-icon">📊</div><span>Antrian</span>
        </div>
        <div className={`nav-item ${activePage === "history" ? "active" : ""}`} onClick={() => setActivePage("history")}>
          <div className="nav-icon">📜</div><span>History</span>
        </div>
      </div>
    </div>
  );
}