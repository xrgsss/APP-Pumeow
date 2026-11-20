# Bukti Eksekusi Modul 3 - APP-Pumeow

Simpan screenshot/rekaman di folder ini dengan nama file yang sudah dirujuk pada sheet
`04_Rancangan_dan_Eksekusi` dan `06_Indeks_Incident`.

| File | Test Case | Isi bukti |
|---|---|---|
| `INC-01_reset_sesi_tetap_aktif.mp4` | TC-BVA-002, TC-EP-022 | Rekaman: reset password sukses -> snackbar "Password berhasil diubah. Silakan login kembali." -> redirect Login -> Home masih bisa dibuka tanpa login ulang |
| `INC-02_forgot_error_ditelan.mp4` | TC-EP-016 | Rekaman: matikan koneksi -> submit Forgot Password -> snackbar "Instruksi Terkirim" tetap muncul padahal request gagal |
| `INC-03_pesan_campur_bahasa.png` | TC-BVA-007, TC-EP-008 | Screenshot pesan "Login Failed - Invalid login credentials" / "Password should be at least 6 characters" pada UI berbahasa Indonesia |

Kasus berstatus Lulus tidak wajib menyertakan bukti (kolom Tautan Bukti diisi `-`).
