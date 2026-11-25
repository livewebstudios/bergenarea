// Organic blobs (reference A): four hand-tuned shapes that sit behind content. Never animated.
import { blobPath } from '../../lib/ink/wash';

const SHAPES = [
  blobPath(300, 300, 262, 232, 0.8, 0.13),
  blobPath(300, 300, 270, 214, 2.3, 0.16),
  blobPath(300, 300, 240, 250, 3.9, 0.12),
  blobPath(300, 300, 276, 196, 5.4, 0.18),
];

interface Props { shape?: 1 | 2 | 3 | 4; className?: string }

export function Blob({ shape = 1, className = '' }: Props) {
  return (
    <svg className={`blob ${className}`.trim()} viewBox="0 0 600 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={SHAPES[shape - 1]} />
    </svg>
  );
}

export default Blob;
