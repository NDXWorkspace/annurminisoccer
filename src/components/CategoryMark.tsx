/**
 * Penanda kategori + lapangan (spesifikasi 7.7).
 * U10: garis ink, latar putih, teks ink (kosong).
 * U12: latar ink, teks putih (terisi).
 * Terbaca tanpa warna: berbeda dari bentuk + teks.
 */
export default function CategoryMark({
  category,
  field,
}: {
  category: string;
  field?: string | null;
}) {
  const cat = category.toUpperCase();
  const filled = cat === 'U12';
  const fieldLabel = field ? ` · Lapangan ${field}` : '';

  return (
    <span
      className={`inline-flex h-6 items-center rounded-[2px] px-1.5 font-mono text-xs font-medium ${
        filled ? 'bg-ink text-white' : 'border-[1.5px] border-ink bg-white text-ink'
      }`}
    >
      {cat}
      {fieldLabel}
    </span>
  );
}
