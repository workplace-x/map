import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ScaleControlProps {
  className?: string
  showCard?: boolean
}

export const ScaleControl: React.FC<ScaleControlProps> = ({ 
  className = '', 
  showCard = true 
}) => {
  const [scale, setScale] = useState(80) // Default 80%
  
  // Load saved scale from localStorage on mount
  useEffect(() => {
    const savedScale = localStorage.getItem('app-scale')
    if (savedScale) {
      const scaleValue = parseInt(savedScale)
      setScale(scaleValue)
      applyScale(scaleValue)
    }
  }, [])

  // Apply scale to CSS custom property
  const applyScale = (scaleValue: number) => {
    document.documentElement.style.setProperty('--app-scale', (scaleValue / 100).toString())
    localStorage.setItem('app-scale', scaleValue.toString())
  }

  // Handle scale change
  const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const scaleValue = parseInt(event.target.value)
    setScale(scaleValue)
    applyScale(scaleValue)
  }

  // Preset scale buttons
  const setPresetScale = (scaleValue: number) => {
    setScale(scaleValue)
    applyScale(scaleValue)
  }

  // Reset to default
  const resetScale = () => {
    setScale(80)
    applyScale(80)
  }

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">App Scale: {scale}%</span>
        <Button
          variant="outline"
          size="sm"
          onClick={resetScale}
          className="h-8 px-2"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min="50"
          max="150"
          step="5"
          value={scale}
          onChange={handleScaleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((scale - 50) / (150 - 50)) * 100}%, #e5e7eb ${((scale - 50) / (150 - 50)) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>50%</span>
          <span>100%</span>
          <span>150%</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresetScale(70)}
          className="flex-1"
        >
          <ZoomOut className="w-3 h-3 mr-1" />
          Compact
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresetScale(80)}
          className="flex-1"
        >
          Normal
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresetScale(100)}
          className="flex-1"
        >
          <ZoomIn className="w-3 h-3 mr-1" />
          Large
        </Button>
      </div>

      <div className="text-xs text-gray-500">
        <strong>Tip:</strong> Lower values show more content, higher values make text larger and easier to read.
      </div>
    </div>
  )

  if (!showCard) {
    return <div className={className}>{content}</div>
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Display Scale</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
} 