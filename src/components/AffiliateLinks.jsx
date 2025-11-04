import React, { useState } from 'react';

const AFFILIATE_LINKS = [
  { name: 'Amazon', url: 'https://www.amazon.com/your-affiliate-link', color: '#FF9900', description: 'Amazon Prime Sign up now', badge: 'Hot' },
  { name: 'Temu', url: 'https://www.temu.com/affiliate/your-affiliate-link', color: '#FF6F61', description: 'Trendy & cheap fashion, gadgets, and home items', badge: 'New' },
  { name: 'Shein', url: 'https://www.shein.com/affiliate/your-affiliate-link', color: '#FF69B4', description: 'Budget-friendly clothing and accessories', badge: 'Popular' },
  { name: 'eBay', url: 'https://www.ebay.com/your-affiliate-link', color: '#E53238', description: 'Rare and unique items at great prices', badge: 'Exclusive' },
  { name: 'AliExpress', url: 'https://www.aliexpress.com/your-affiliate-link', color: '#FF4747', description: 'Affordable international products', badge: 'Hot' },
  { name: 'Walmart', url: 'https://www.walmart.com/your-affiliate-link', color: '#0071CE', description: 'Everyday essentials and movie-night deals', badge: 'Value' },
  { name: 'Target', url: 'https://www.target.com/your-affiliate-link', color: '#CC0000', description: 'Trendy items for all budgets', badge: 'Popular' },
  { name: 'Newegg', url: 'https://www.newegg.com/your-affiliate-link', color: '#F58220', description: 'Affordable tech gadgets and accessories', badge: 'Deal' },
  { name: 'Rakuten', url: 'https://www.rakuten.com/affiliate/your-affiliate-link', color: '#004B87', description: 'Cashback deals and discounts', badge: 'Bonus' },
  { name: 'Amazon', url: 'https://www.amazon.com/your-affiliate-link', color: '#FF9900', description: 'Millions of affordable products and deals', badge: 'Hot' },
];

export default function AffiliateLinks() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section
      className="affiliate-links"
      style={{
        position: 'relative',
        textAlign: 'center',
        margin: '50px 0',
        padding: '40px 20px',
        background: 'linear-gradient(145deg, #1f1f1f, #2c2c2c)',
        borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      <h2
        style={{
          fontSize: '2rem',
          fontWeight: '900',
          color: '#FFD700',
          marginBottom: '15px',
          textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        Support Us & Unlock Perks!
      </h2>
      <p
        style={{
          fontSize: '1.2rem',
          color: '#fff',
          marginBottom: '40px',
          maxWidth: '700px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.6',
        }}
      >
        Affiliate Disclosure: We earn a commission when you sign up through our links at no extra cost to you. This helps us keep Prestige Movies free and running!
      </p>

      {/* Grid of affiliate cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '20px',
          justifyItems: 'center',
          alignItems: 'stretch',
        }}
      >
        {AFFILIATE_LINKS.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
              width: '100%',
              maxWidth: '180px',
              padding: '20px 15px',
              borderRadius: '12px',
              textDecoration: 'none',
              background: `linear-gradient(145deg, ${link.color}, #000)`,
              color: '#fff',
              fontWeight: '700',
              textAlign: 'center',
              boxShadow: '0 5px 12px rgba(0,0,0,0.4)',
              transition: 'all 0.3s ease',
              transform: hoveredIndex === index ? 'scale(1.08) rotateY(5deg)' : 'scale(1)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span style={{ fontSize: '1.05rem', marginBottom: '6px' }}>{link.name}</span>
            <span
              style={{
                fontSize: '0.75rem',
                color: hoveredIndex === index ? '#FFD700' : '#fff',
                transition: 'color 0.3s ease',
              }}
            >
              {link.description}
            </span>
            <span
              style={{
                marginTop: '8px',
                fontSize: '0.65rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: '600',
              }}
            >
              {link.badge}
            </span>

            {/* Hover glow - pointerEvents none ensures clicks pass through */}
            {hoveredIndex === index && (
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  right: '-10px',
                  bottom: '-10px',
                  borderRadius: '16px',
                  background: `radial-gradient(circle, ${link.color}33, transparent)`,
                  filter: 'blur(12px)',
                  zIndex: 0,
                  animation: 'pulse 1.5s infinite alternate',
                  pointerEvents: 'none',
                }}
              />
            )}
          </a>
        ))}
      </div>

      {/* Animated background gradient */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(60deg, #FFD700, #FF4500, #00BFFF, #32CD32)',
          backgroundSize: '600% 600%',
          animation: 'gradientMove 15s ease infinite',
          opacity: 0.05,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.6; }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @media (max-width: 768px) {
          .affiliate-links a {
            padding: 16px 12px !important;
            font-size: 0.95rem !important;
          }
        }
        @media (max-width: 480px) {
          .affiliate-links a {
            padding: 14px 10px !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </section>
  );
}
