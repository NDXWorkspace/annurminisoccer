/**
 * Penanda kategori + lapangan.
 * U10: garis putih, latar kosong. U12: latar putih, teks gelap.
 * Terbaca tanpa warna — beda dari bentuk, bukan dari rona.
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

  return (
    <span className={`mark ${filled ? 'mark-solid' : 'mark-outline'}`}>
      {cat} · Lapangan {field ?? (filled ? 2 : 1)}
    </span>
  );
}