import { useState } from 'react';

const LABELS = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];

// Read-only stars, e.g. 4.3 shows four and a bit stars filled
export function Stars({ value = 0, size = 16 }) {
  const percent = Math.max(0, Math.min(value, 5)) * 20;
  return (
    <span
      className="stars"
      style={{ '--fill': `${percent}%`, fontSize: size }}
      role="img"
      aria-label={`${Number(value).toFixed(1)} out of 5 stars`}
    >
      ★★★★★
    </span>
  );
}

// Clickable stars for writing a review
export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="star-input">
      <div role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}, ${LABELS[n - 1]}`}
            className={n <= shown ? 'is-on' : ''}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ))}
      </div>
      <span className="star-input-label">{shown ? LABELS[shown - 1] : 'Tap a star'}</span>
    </div>
  );
}