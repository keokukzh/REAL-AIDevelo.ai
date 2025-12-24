import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"
import { useReducedMotion } from "../../hooks/useReducedMotion"

interface SmoothScrollProps {
  children: React.ReactNode
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  const handleResize = useCallback(() => {
    if (scrollRef.current) {
      setContentHeight(scrollRef.current.scrollHeight)
    }
  }, [])

  useLayoutEffect(() => {
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [handleResize, children])

  const { scrollY } = useScroll()
  
  // Smoothing configuration
  const springConfig = {
    damping: 20,
    stiffness: 90,
    mass: 1,
    restDelta: 0.001
  }

  const smoothY = useSpring(scrollY, springConfig)
  
  // Inverse the scroll position for the content translation
  const y = useTransform(smoothY, (value) => -value)

  // Handle anchor link clicks
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest("a")
      if (anchor && anchor.getAttribute("href")?.startsWith("#")) {
        e.preventDefault()
        const id = anchor.getAttribute("href")?.slice(1)
        const element = document.getElementById(id || "")
        if (element) {
          const offsetTop = element.getBoundingClientRect().top + window.scrollY
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth"
          })
        }
      }
    }

    document.addEventListener("click", handleAnchorClick)
    return () => document.removeEventListener("click", handleAnchorClick)
  }, [])

  if (prefersReducedMotion) {
    return <div className="w-full">{children}</div>
  }

  return (
    <>
      <div 
        style={{ height: contentHeight }} 
        className="invisible pointer-events-none w-full" 
        aria-hidden="true" 
      />
      <motion.div
        ref={scrollRef}
        style={{ y }}
        className="fixed top-0 left-0 w-full overflow-hidden will-change-transform z-0"
      >
        {children}
      </motion.div>
    </>
  )
}
