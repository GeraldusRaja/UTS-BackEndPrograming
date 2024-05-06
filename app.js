// Import libraries
const express = require('express'); // Library untuk membuat aplikasi web dengan Express.js
const mongoose = require('mongoose'); // Library untuk menghubungkan dan berinteraksi dengan MongoDB

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/eCommerceDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }) // Menghubungkan ke database MongoDB dengan nama 'eCommerceDB' di localhost
  .then(() => console.log('Berhasil terhubung ke MongoDB')) // Log pesan sukses jika koneksi berhasil
  .catch((err) => console.error('Gagal terhubung ke MongoDB:', err)); // Log pesan kesalahan jika koneksi gagal

// Mendefinisikan skema mongoose
const transactionSchema = new mongoose.Schema({
  productName: String, // Nama produk minuman
  quantity: Number, // Jumlah produk minuman yang dibeli
  price: Number, // Harga per unit produk minuman
  description: String, // Menambahkan bidang deskripsi produk
  transactionDate: { type: Date, default: Date.now }, // Tanggal transaksi, secara default menggunakan tanggal dan waktu saat ini
});

// Mendefinisikan model mongoose
const Transaction = mongoose.model('Transaction', transactionSchema); // Membuat model mongoose 'Transaction' yang sesuai dengan skema transaksi

// Membuat aplikasi Express
const app = express(); // Membuat aplikasi Express

app.use(express.json()); // Menggunakan middleware untuk mengurai permintaan JSON

// Rute-rute
// Membuat transaksi
app.post('/marketplace', async (req, res) => {
  // Endpoint untuk membuat transaksi baru
  try {
    const { productName, quantity, price, description } = req.body; // Mendapatkan data transaksi dari permintaan POST
    const transaction = new Transaction({
      productName,
      quantity,
      price,
      description,
    }); // Membuat objek transaksi baru berdasarkan data yang diterima
    await transaction.save(); // Menyimpan transaksi baru ke database
    res.status(201).json(transaction); // Mengirim respons JSON dengan transaksi yang telah dibuat dan status kode 201 (Created)
  } catch (error) {
    res.status(400).json({ message: error.message }); // Mengirim respons JSON dengan pesan kesalahan dan status kode 400 (Bad Request) jika terjadi kesalahan
  }
});

// Membaca riwayat transaksi dengan pagination dan pencarian berdasarkan nama produk
app.get('/marketplace', async (req, res) => {
  // Endpoint untuk membaca riwayat transaksi dengan pagination dan pencarian berdasarkan nama produk
  try {
    const page = parseInt(req.query.page) || 1; // Mendapatkan nomor halaman dari query parameter, default ke halaman 1 jika tidak ada
    const pageSize = parseInt(req.query.page_size) || 10; // Mendapatkan ukuran halaman dari query parameter, default ke 10 jika tidak ada
    const searchProductName = req.query.search || ''; // Mendapatkan parameter pencarian berdasarkan nama produk

    const totalTransactions = await Transaction.countDocuments({
      productName: { $regex: searchProductName, $options: 'i' },
    }); // Menghitung total transaksi berdasarkan pencarian nama produk
    const totalPages = Math.ceil(totalTransactions / pageSize); // Menghitung total halaman

    const transactions = await Transaction.find({
      productName: { $regex: searchProductName, $options: 'i' },
    })
      .skip((page - 1) * pageSize) // Melewati transaksi yang sudah ditampilkan sebelumnya
      .limit(pageSize); // Batasi jumlah transaksi yang ditampilkan per halaman

    const responseData = {
      page_number: page,
      page_size: pageSize,
      count: transactions.length,
      total_pages: totalPages,
      has_previous_page: page > 1,
      has_next_page: page < totalPages,
      data: transactions.map((transaction) => ({
        id: transaction._id,
        productName: transaction.productName,
        quantity: transaction.quantity,
        price: transaction.price,
        description: transaction.description,
        transactionDate: transaction.transactionDate,
      })),
    };

    res.json(responseData); // Mengirim respons JSON dengan data transaksi sesuai dengan format yang diminta
  } catch (error) {
    res.status(500).json({ message: error.message }); // Mengirim respons JSON dengan pesan kesalahan dan status kode 500 (Internal Server Error) jika terjadi kesalahan
  }
});

// Memperbarui detail transaksi
app.put('/marketplace/:id', async (req, res) => {
  // Endpoint untuk memperbarui detail transaksi
  try {
    const { id } = req.params; // Mendapatkan ID transaksi dari URL
    const { productName, quantity, price, description } = req.body; // Mendapatkan data yang ingin diperbarui dari permintaan PUT
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { productName, quantity, price, description }, // Menambahkan deskripsi ke dalam objek yang ingin diperbarui
      { new: true }
    ); // Memperbarui transaksi dengan ID yang sesuai
    res.json(updatedTransaction); // Mengirim respons JSON dengan transaksi yang telah diperbarui dan status kode 200 (OK)
  } catch (error) {
    res.status(400).json({ message: error.message }); // Mengirim respons JSON dengan pesan kesalahan dan status kode 400 (Bad Request) jika terjadi kesalahan
  }
});

// Menghapus transaksi
app.delete('/marketplace/:id', async (req, res) => {
  // Endpoint untuk menghapus transaksi
  try {
    const { id } = req.params; // Mendapatkan ID transaksi dari URL
    await Transaction.findByIdAndDelete(id); // Menghapus transaksi dengan ID yang sesuai
    res.json({ message: 'Transaksi berhasil dihapus' }); // Mengirim respons JSON dengan pesan sukses dan status kode 200 (OK)
  } catch (error) {
    res.status(400).json({ message: error.message }); // Mengirim respons JSON dengan pesan kesalahan dan status kode 400 (Bad Request) jika terjadi kesalahan
  }
});

// Menentukan port server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server berjalan di port ${PORT} dalam lingkungan pengembangan`)
); // Memulai server dan menampilkan pesan saat server berhasil berjalan
