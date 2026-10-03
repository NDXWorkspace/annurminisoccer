/**
 * Motif garis lapangan: lingkaran tengah, garis tengah, kotak penalti,
 * dan garisorious penalti yang tergambar sendiri saat halaman dibuka.
 * Satu-satunya tempat motif lapangan dipakai di luar halaman kosong.
 */
export default function PitchGraphic() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 640 520"
      className="pointer-events-none absolute -right-40 -top-24 hidden h-[500px] w-[620px] opacity-60 sm:block"
      fill="none"
      stroke="var(--color-blue)"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <circle className="animate-draw" cx={400} cy={260} r={120} />
      <circle cx={400} cy={260} r={4} fill="var(--color-blue)" stroke="none" />
      <line className="animate-draw" x1={400} y1={0} x2={400} y2={520} />
      <rect className="animate-draw" x={400} y={130} width={230} height={260} />
      <rect className="animate-draw" x={400} y={190} width={100} height={140} />
      {/* lintasan tipis + bola yang menyusurinya */}
      <path
        d="M60 420 C 200 120, 380 80, 520 300"
        strokeDasharray="4 8"
        opacity={0.5}
        className="animate-draw"
      />
      <circle className="animate-ball" r={7} fill="#fff" stroke="none" />
    </svg>
  );
}