"use client"

import { useState } from 'react'

interface FallbackImageProps {
  src: string
  alt: string
  fallbackSrc: string
  className?: string
}

export default function FallbackImage({ src, alt, fallbackSrc, className }: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  
  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className || ''}
      onError={() => setImgSrc(fallbackSrc)}
    />
  )
} 