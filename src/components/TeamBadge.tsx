import { Team } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import Image from 'next/image';

interface TeamBadgeProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = {
  sm: { box: 'h-9 w-9', text: 'text-[11px]', pad: 'p-[2px]' },
  md: { box: 'h-14 w-14', text: 'text-base', pad: 'p-1' },
  lg: { box: 'h-20 w-20', text: 'text-xl', pad: 'p-1.5' },
};

export default function TeamBadge({ team, size = 'md', className = '' }: TeamBadgeProps) {
  const s = SIZE[size];
  const hex = team.color || '#d3ff3f';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${s.box} ${s.pad} ${className}`}
      style={{
        // Crest plate: a diagonal sheen in the club colour so flat hexes still read dimensional
        backgroundImage: `linear-gradient(145deg, ${hex} 0%, ${hex} 46%, color-mix(in srgb, ${hex} 62%, #060b16) 100%)`,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${hex} 70%, #ffffff 12%), 0 6px 18px -10px ${hex}`,
      }}
    >
      {team.logo_url ? (
        <Image src={team.logo_url} alt={team.name} fill className="object-cover" sizes="80px" />
      ) : (
        <>
          {/* inner keyline, like a stitched badge */}
          <span
            className="pointer-events-none absolute inset-[3px] rounded-full border border-white/25"
            aria-hidden
          />
          <span className={`font-display font-bold uppercase leading-none tracking-wide text-white drop-shadow-sm ${s.text}`}>
            {getInitials(team.name)}
          </span>
        </>
      )}
    </div>
  );
}
