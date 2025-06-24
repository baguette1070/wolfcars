"use client";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";

export default function Carousel({ images }: { images: StaticImageData[] }) {
  const [current, setCurrent] = useState(0);
  const [anim, setAnim] = useState<"in" | "out" | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const total = images.length;

  const goLeft = () => {
    setDirection("left");
    setAnim("out");
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + total) % total);
      setAnim("in");
    }, 150);
    setTimeout(() => setAnim(null), 350);
  };
  const goRight = () => {
    setDirection("right");
    setAnim("out");
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % total);
      setAnim("in");
    }, 150);
    setTimeout(() => setAnim(null), 350);
  };

  return (
    <div className="relative w-full flex items-center justify-center mb-8 min-h-[300px]">
      <button
        type="button"
        aria-label="Précédent"
        onClick={goLeft}
        className="absolute left-0 z-10 bg-white/80 hover:bg-white rounded-full shadow p-2 m-2"
      >
        <span className="text-2xl">&#8592;</span>
      </button>
      <div className="flex items-center justify-center w-full gap-4 select-none">
        {/* Left image (blurred, small) */}
        <div className="hidden md:block transition-all duration-300">
          <Image
            src={images[(current - 1 + total) % total]}
            alt="prev"
            width={240}
            height={160}
            className="rounded object-cover shadow opacity-60 blur-sm"
            style={{ filter: "blur(4px)" }}
          />
        </div>
        {/* Main image with slide animation */}
        <div className="transition-all duration-300 relative w-[560px] h-[380px] flex items-center justify-center">
          <Image
            src={images[current]}
            alt={`Audi RS3 image ${current + 1}`}
            width={560}
            height={380}
            className={`rounded object-cover shadow-lg transition-all duration-300 absolute left-0 top-0 w-full h-full
              ${
                anim === "out"
                  ? direction === "right"
                    ? "animate-slide-out-left"
                    : "animate-slide-out-right"
                  : anim === "in"
                    ? direction === "right"
                      ? "animate-slide-in-right"
                      : "animate-slide-in-left"
                    : "opacity-100 scale-100"
              }
            `}
            style={{ transition: "opacity 0.2s, transform 0.2s" }}
          />
        </div>
        {/* Right image (blurred, small) */}
        <div className="hidden md:block transition-all duration-300">
          <Image
            src={images[(current + 1) % total]}
            alt="next"
            width={240}
            height={160}
            className="rounded object-cover shadow opacity-60 blur-sm"
            style={{ filter: "blur(4px)" }}
          />
        </div>
      </div>
      <button
        type="button"
        aria-label="Suivant"
        onClick={goRight}
        className="absolute right-0 z-10 bg-white/80 hover:bg-white rounded-full shadow p-2 m-2"
      >
        <span className="text-2xl">&#8594;</span>
      </button>
      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes slide-out-left {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-60px) scale(0.95);
          }
        }
        @keyframes slide-out-right {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(60px) scale(0.95);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s;
        }
        .animate-slide-out-left {
          animation: slide-out-left 0.2s;
        }
        .animate-slide-out-right {
          animation: slide-out-right 0.2s;
        }
      `}</style>
    </div>
  );
}
