'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: string
  onComplete?: () => void
  className?: string
}

export default function CountdownTimer({ targetDate, onComplete, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 15,
    hours: 5,
    minutes: 10,
    seconds: 5
  })
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        let { days, hours, minutes, seconds } = prevTime

        // Countdown logic - subtract 1 second
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        } else if (days > 0) {
          days--
          hours = 23
          minutes = 59
          seconds = 59
        } else {
          // Timer complete
          if (!isComplete) {
            setIsComplete(true)
            onComplete?.()
          }
          return { days: 0, hours: 0, minutes: 0, seconds: 0 }
        }

        return { days, hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onComplete, isComplete])

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="text-center">
        <div className="text-lg font-bold">{timeLeft.days}</div>
        <div className="text-xs">Days</div>
      </div>
      <div>:</div>
      <div className="text-center">
        <div className="text-lg font-bold">{timeLeft.hours}</div>
        <div className="text-xs">Hours</div>
      </div>
      <div>:</div>
      <div className="text-center">
        <div className="text-lg font-bold">{timeLeft.minutes}</div>
        <div className="text-xs">Min</div>
      </div>
      <div>:</div>
      <div className="text-center">
        <div className="text-lg font-bold">{timeLeft.seconds}</div>
        <div className="text-xs">Sec</div>
      </div>
    </div>
  )
}