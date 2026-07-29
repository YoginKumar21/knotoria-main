import { useEffect, useState, useCallback, useRef } from "react";

const slides = [
  { type: "image", src: "/Crochet-images/20251228_142627.jpg", alt: "Knotoria item 1", title: "Vanilla Cake Plump", price: "₹200", rating: 5 },
  { type: "video", src: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-hands-knitting-wool-40332-large.mp4", alt: "Handmade Knitting", title: "Stitching Magic", price: "₹450", rating: 5 },
  { type: "image", src: "/Crochet-images/20260130_083108.jpg", alt: "Knotoria item 2", title: "Straw Cake Special", price: "₹250", rating: 5 },
  { type: "image", src: "/Crochet-images/20260131_172608.jpg", alt: "Knotoria item 3", title: "Amigurumi Pizza", price: "₹220", rating: 5 },
  { type: "image", src: "/Crochet-images/20260131_172711.jpg", alt: "Knotoria item 4", title: "Cozy Meat Ball Bundle", price: "₹180", rating: 4 },
  { type: "image", src: "/Crochet-images/20260221_060923.jpg", alt: "Knotoria item 5", title: "Premium Burger Set", price: "₹300", rating: 5 },
  { type: "image", src: "/Crochet-images/20260314_173826.jpg", alt: "Knotoria item 6", title: "Cute Bunny Friend", price: "₹220", rating: 5 },
  { type: "image", src: "/Crochet-images/20260320_144200.jpg", alt: "Knotoria item 7", title: "Pastel Beanie Soft", price: "₹150", rating: 5 }
];

export default function HeroCarousel() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const startX = useRef(0);
  const startProgress = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  
  const velocity = useRef(0);
  const targetProgress = useRef(0);
  const currentProgressRef = useRef(0);
  const animationFrameId = useRef(null);
  const isAnimatingToTarget = useRef(false);

  const pixelsPerSlide = 260; 

  useEffect(() => {
    currentProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  // Unified Autoplay loop
  useEffect(() => {
    if (paused || isDragging) return;
    
    const id = setInterval(() => {
      animateToTarget(Math.round(currentProgressRef.current + 1));
    }, 5500);

    return () => clearInterval(id);
  }, [paused, isDragging, scrollProgress]);

  useEffect(() => {
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const animateToTarget = (target) => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    targetProgress.current = target;
    isAnimatingToTarget.current = true;

    let lastFrameTime = performance.now();

    const lerpLoop = (now) => {
      const deltaTime = Math.min(now - lastFrameTime, 32);
      lastFrameTime = now;

      const diff = targetProgress.current - currentProgressRef.current;
      
      if (Math.abs(diff) < 0.001) {
        setScrollProgress(targetProgress.current);
        velocity.current = 0;
        isAnimatingToTarget.current = false;
        return;
      }

      const stepFactor = 1 - Math.exp(-0.008 * deltaTime); 
      setScrollProgress((prev) => prev + diff * stepFactor);
      
      animationFrameId.current = requestAnimationFrame(lerpLoop);
    };
    animationFrameId.current = requestAnimationFrame(lerpLoop);
  };

  const handleDragStart = (clientX) => {
    setPaused(true);
    setIsDragging(true);
    velocity.current = 0;
    isAnimatingToTarget.current = false;
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

    startX.current = clientX;
    startProgress.current = currentProgressRef.current;
    lastX.current = clientX;
    lastTime.current = performance.now();
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;

    const now = performance.now();
    const deltaX = clientX - lastX.current;
    const deltaTime = now - lastTime.current;

    if (deltaTime > 0 && deltaTime < 100) {
      const instantVelocity = (deltaX / pixelsPerSlide) / deltaTime;
      velocity.current = velocity.current * 0.4 + instantVelocity * 0.6;
    }

    const totalMovedX = clientX - startX.current;
    const progressDelta = totalMovedX / pixelsPerSlide;

    setScrollProgress(startProgress.current - progressDelta);
    lastX.current = clientX;
    lastTime.current = now;
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    let lastFrameTime = performance.now();

    if (Math.abs(velocity.current) > 0.001) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

      const momentumLoop = (now) => {
        const deltaTime = Math.min(now - lastFrameTime, 32);
        lastFrameTime = now;

        const frictionFactor = Math.pow(0.95, deltaTime / 16);
        velocity.current *= frictionFactor;

        if (Math.abs(velocity.current) < 0.001) {
          targetProgress.current = Math.round(currentProgressRef.current);
          animateToTarget(targetProgress.current);
          setPaused(false);
          return;
        }

        setScrollProgress((prev) => prev - velocity.current * deltaTime);
        animationFrameId.current = requestAnimationFrame(momentumLoop);
      };
      animationFrameId.current = requestAnimationFrame(momentumLoop);
    } else {
      targetProgress.current = Math.round(currentProgressRef.current);
      animateToTarget(targetProgress.current);
      setPaused(false);
    }
  };

  const getSlideStyle = (slideIndex) => {
    const totalSlides = slides.length;
    let diff = slideIndex - (scrollProgress % totalSlides);
    
    if (diff > totalSlides / 2) diff -= totalSlides;
    if (diff < -totalSlides / 2) diff += totalSlides;

    let baseTranslateX = diff * 52; 
    let baseScale = Math.max(0.5, 1.1 - Math.abs(diff) * 0.18);
    let brightness = Math.max(35, 100 - Math.abs(diff) * 22);
    let opacity = Math.max(0, 100 - Math.abs(diff) * 22);
    let zIndex = Math.round(100 - Math.abs(diff) * 20);

    return {
      transform: `translateX(${baseTranslateX}%) scale(${baseScale})`,
      filter: `brightness(${brightness}%)`,
      zIndex: zIndex,
      opacity: opacity / 100,
    };
  };

  const activeNormalizedIndex = ((Math.round(scrollProgress) % slides.length) + slides.length) % slides.length;
  const activeSlide = slides[activeNormalizedIndex];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden p-8 flex flex-col items-center select-none shadow-inner border border-oat">
      
      {/* Low-Opacity Dynamic Background Showcase */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 transition-all duration-700">
        <div className="absolute inset-0 bg-cream/80 mix-blend-overlay z-10"></div>
        {activeSlide.type === "video" ? (
          <video
            src={activeSlide.src}
            autoPlay
            loop
            muted
            playsInline
            key={activeSlide.src}
            className="w-full h-full object-cover scale-125 opacity-10 blur-3xl transition-all duration-1000"
          />
        ) : (
          <img
            src={activeSlide.src}
            alt="ambient background"
            key={activeSlide.src}
            className="w-full h-full object-cover scale-125 opacity-10 blur-3xl transition-all duration-1000"
          />
        )}
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[240px] md:h-[310px] flex items-center justify-center overflow-visible cursor-default z-10"
        onMouseEnter={() => setPaused(true)}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => { if(isDragging) handleDragEnd(); setPaused(false); }}
        
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        {slides.map((slide, i) => {
          const style = getSlideStyle(i);
          return (
            <div
              key={slide.src}
              className="absolute w-[60%] sm:w-[46%] md:w-[36%] h-full rounded-3xl overflow-hidden border border-cocoa/5 bg-white pointer-events-none shadow-md"
              style={style}
            >
              {slide.type === "video" ? (
                <video 
                  src={slide.src} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover" 
                  draggable="false" 
                />
              ) : (
                <img 
                  src={slide.src} 
                  alt={slide.alt} 
                  className="w-full h-full object-cover" 
                  draggable="false" 
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-5 text-white">
                <div className="self-end bg-black/45 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold tracking-wide">{slide.price}</div>
                <div>
                  <h3 className="font-display text-base md:text-lg font-bold leading-snug mb-1">{slide.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/80 font-medium">4.8</span>
                    <div className="flex gap-0.5 text-amber-400 text-xs">
                      {Array.from({ length: slide.rating }).map((_, idx) => <span key={idx}>★</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Dots Track */}
      <div className="flex items-center gap-6 mt-10 z-10">
        <button 
          onClick={() => animateToTarget(Math.round(currentProgressRef.current - 1))} 
          className="bg-white border border-oat text-cocoa hover:bg-clay hover:text-cream rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const diff = i - activeNormalizedIndex;
                animateToTarget(Math.round(currentProgressRef.current) + diff);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${i === activeNormalizedIndex ? "w-5 bg-clay" : "w-2 bg-cocoa/20 hover:bg-cocoa/40"}`}
            />
          ))}
        </div>
        
        <button 
          onClick={() => animateToTarget(Math.round(currentProgressRef.current + 1))} 
          className="bg-white border border-oat text-cocoa hover:bg-clay hover:text-cream rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}