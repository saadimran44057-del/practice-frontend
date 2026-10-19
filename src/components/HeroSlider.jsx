import { useEffect, useRef, useState } from 'react';
import { imageSrc } from '../api.js';
import { IconEdit, IconChevronLeft, IconChevronRight } from './Icons.jsx';

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;

const greeting = (name) => {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name.split(' ')[0]}`;
};

// The "shop window" at the top of the products page.
// slides = products that have a photo (at least one). Each one shows for a few seconds.
function HeroSlider({ user, slides, canEdit, onEdit }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);

  const count = slides.length;
  const current = slides[Math.min(index, count - 1)];

  const go = (next) => setIndex((next + count) % count);

  // If a product was removed and the list got shorter, start again from the first slide
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count]);

  // Swipe left / right on phones
  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const distance = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 50) go(index + (distance < 0 ? 1 : -1));
    touchStart.current = null;
  };

  const isMine = current.userId === user.id;

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Shop window"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-copy">
        <p className="hero-greet">{greeting(user.name)}</p>

        {/* key makes the text fade in again on every slide */}
        <div className="hero-text" key={current.id} aria-live="polite">
          <h2 className="hero-title">{current.name}</h2>
          <p className="hero-price">{formatPrice(current.price)}</p>
          {current.description && <p className="hero-desc">{current.description}</p>}
          {!isMine && current.User && <p className="hero-owner">Listed by {current.User.name}</p>}
        </div>

        {canEdit(current) && (
          <div className="hero-actions">
            <button type="button" className="btn btn-light" onClick={() => onEdit(current)}>
              <IconEdit /> Edit product
            </button>
          </div>
        )}

        {count > 1 && (
          <div className="hero-controls">
            <div className="hero-progress">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`hero-seg ${i < index ? 'is-done' : ''} ${i === index ? 'is-active' : ''}`}
                  aria-label={`Show ${s.name}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => go(i)}
                >
                  {/* When this bar finishes filling, move to the next slide */}
                  <span
                    className="hero-seg-fill"
                    key={i === index ? `active-${index}` : 'idle'}
                    onAnimationEnd={() => go(index + 1)}
                  />
                </button>
              ))}
            </div>
            <div className="hero-arrows">
              <button type="button" className="hero-arrow" aria-label="Previous product" onClick={() => go(index - 1)}>
                <IconChevronLeft />
              </button>
              <button type="button" className="hero-arrow" aria-label="Next product" onClick={() => go(index + 1)}>
                <IconChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hero-media">
        {slides.map((s, i) => (
          <img
            key={s.id}
            src={imageSrc(s.image)}
            alt={i === index ? s.name : ''}
            className={`hero-img ${i === index ? 'is-active' : ''}`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
        {count > 1 && (
          <span className="hero-count">
            {index + 1} / {count}
          </span>
        )}
      </div>
    </section>
  );
}

export default HeroSlider;