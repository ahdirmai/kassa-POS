import Link from "next/link";

export default function DigitalMenuNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fafaf9] px-4 py-16 text-center text-slate-900">
      <div className="max-w-md space-y-4">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 font-display text-xl font-bold text-white">
          K
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Menu Digital Tidak Ditemukan
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Halaman menu digital cafe yang Anda cari belum diaktifkan atau alamat URL telah berubah.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Kembali ke Tumpu.biz.id
          </Link>
        </div>
      </div>
    </main>
  );
}
