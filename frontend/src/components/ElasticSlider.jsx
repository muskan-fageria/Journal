import React, { useEffect, useRef, useState } from 'react';

export default function ElasticSlider({
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = null,
  rightIcon = null,
  rangeColorClass = 'bg-secondary',
  rangeColorStyle = null,
  onChange = null
}) {
  const [value, setValue] = useState(defaultValue);
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const calculateValue = (clientX) => {
    if (!sliderRef.current) return value;
    const { left, width } = sliderRef.current.getBoundingClientRect();
    if (width === 0) return value;
    
    let newValue = startingValue + ((clientX - left) / width) * (maxValue - startingValue);
    newValue = Math.max(startingValue, Math.min(maxValue, newValue));

    if (isStepped) {
      newValue = Math.round(newValue / stepSize) * stepSize;
    }
    return newValue;
  };

  const handlePointerDown = (e) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDragging(true);
    const newValue = calculateValue(e.clientX);
    setValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const newValue = calculateValue(e.clientX);
    setValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;
    return ((value - startingValue) / totalRange) * 100;
  };

  return (
    <div className={`flex items-center w-full touch-none select-none gap-4 ${className}`}>
      {/* Left Icon */}
      {leftIcon && (
        <div className={`flex items-center justify-center flex-shrink-0 transition-opacity duration-300 ${isHovered || isDragging ? 'opacity-100' : 'opacity-60'}`}>
          {leftIcon}
        </div>
      )}

      {/* Slider Track Area */}
      <div
        ref={sliderRef}
        className="relative flex flex-grow h-6 cursor-pointer items-center group"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Track Background */}
        <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden relative">
          {/* Track Fill */}
          <div
            className={`absolute top-0 left-0 h-full rounded-full ${rangeColorClass} transition-all`}
            style={{ 
              width: `${getRangePercentage()}%`, 
              transitionDuration: isDragging ? '0ms' : '300ms',
              ...(rangeColorStyle || {}) 
            }}
          />
        </div>
        
        {/* Thumb */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 pointer-events-none ${rangeColorClass} ${isDragging ? 'scale-125 shadow-md' : isHovered ? 'scale-100' : 'scale-0'}`}
          style={{ left: `${getRangePercentage()}%`, ...(rangeColorStyle || {}) }}
        />
      </div>

      {/* Right Icon */}
      {rightIcon && (
        <div className={`flex items-center justify-center flex-shrink-0 transition-opacity duration-300 ${isHovered || isDragging ? 'opacity-100' : 'opacity-60'}`}>
          {rightIcon}
        </div>
      )}
    </div>
  );
}
