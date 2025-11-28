import React from 'react';

interface LicensePlateProps {
  plateNumber: string;
  variant?: 'sm' | 'md' | 'lg';
  regionCode?: string;
  subRegionCode?: string;
}

export const LicensePlate: React.FC<LicensePlateProps> = ({ 
  plateNumber, 
  variant = 'sm',
  regionCode = 'DK',
  subRegionCode = '01'
}) => {
  // Normalize and parse the plate string
  // Assumes formats like "AA 123 BB" or "AA-123-BB" or "DK 8888 A"
  const cleanPlate = plateNumber.toUpperCase().trim();
  const parts = cleanPlate.split(/[\s-]+/).filter(Boolean);
  
  let p1 = '';
  let p2 = '';
  let p3 = '';

  if (parts.length >= 3) {
      p1 = parts[0];
      p2 = parts[1];
      p3 = parts[2];
  } else if (parts.length === 2) {
      p1 = parts[0];
      p2 = parts[1];
  } else if (parts.length === 1) {
      // Fallback for solid string like "AA123BB" - naive split
      const match = cleanPlate.match(/^([A-Z]+)(\d+)([A-Z]+)?$/);
      if (match) {
          p1 = match[1];
          p2 = match[2];
          p3 = match[3] || '';
      } else {
          p2 = parts[0];
      }
  }

  // Scale map for different UI contexts
  // Base dimensions: 520px x 112px
  const scaleMap = {
    sm: 0.40, // ~208px wide (Good for cards)
    md: 0.60, // ~312px wide
    lg: 0.80  // ~416px wide
  };
  const scale = scaleMap[variant];
  const baseWidth = 520;
  const baseHeight = 112;

  return (
    <div 
      className="relative select-none"
      style={{
        width: `${baseWidth * scale}px`,
        height: `${baseHeight * scale}px`,
      }}
    >
      <div 
        className="plate-container absolute top-0 left-0 origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
          <div className="blue-strip">
              <div className="flag">
                  <svg className="star" viewBox="0 0 24 24"><path fill="#00853f" d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.869 1.4-8.168-5.934-5.787 8.2-1.192z"/></svg>
              </div>
              <div className="country-code">SN</div>
          </div>
          <div className="qr-placeholder"></div>
          <div className="main-content">
              <span>{p1}</span>
              {p1 && p2 && <span className="separator-hyphen"></span>}
              <span>{p2}</span>
              {p2 && p3 && <span className="separator-hyphen"></span>}
              <span>{p3}</span>
          </div>
          <div className="region-stack">
              <span className="region-top">{regionCode}</span>
              <span className="region-bottom">{subRegionCode}</span>
          </div>
      </div>
    </div>
  );
};
