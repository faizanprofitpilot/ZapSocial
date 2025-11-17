"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageExpandModalProps = {
  imageUrls: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
};

export function ImageExpandModal({ imageUrls, initialIndex = 0, isOpen, onClose }: ImageExpandModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || imageUrls.length === 0) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : prev));
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, imageUrls.length]);

  const currentImage = imageUrls[currentIndex];
  const hasNext = currentIndex < imageUrls.length - 1;
  const hasPrev = currentIndex > 0;

  const goToNext = () => {
    if (currentIndex < imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || imageUrls.length === 0 || !mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 9999
      }}
    >
      {/* Centered image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentImage}
        alt={`Expanded image ${currentIndex + 1} of ${imageUrls.length}`}
        style={{
          display: 'block',
          maxHeight: '90vh',
          maxWidth: '90vw',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          margin: 'auto',
          position: 'relative',
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          right: '1rem',
          top: '1rem',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        aria-label="Close"
      >
        <X style={{ width: '1.25rem', height: '1.25rem' }} />
      </button>

      {imageUrls.length > 1 && hasPrev && (
        <button
          onClick={goToPrev}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          aria-label="Previous image"
        >
          <ChevronLeft style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>
      )}

      {imageUrls.length > 1 && hasNext && (
        <button
          onClick={goToNext}
          style={{
            position: 'absolute',
            right: '4rem',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          aria-label="Next image"
        >
          <ChevronRight style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>
      )}

      {imageUrls.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '0.5rem 1rem',
            backdropFilter: 'blur(12px)'
          }}
        >
          {imageUrls.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                padding: 0
              }}
              onMouseEnter={(e) => {
                if (index !== currentIndex) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentIndex) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                }
              }}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {imageUrls.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            borderRadius: '9999px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: 'white',
            backdropFilter: 'blur(12px)'
          }}
        >
          {currentIndex + 1} / {imageUrls.length}
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}

