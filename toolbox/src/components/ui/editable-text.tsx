import React, { useState } from 'react'
import { RichTextEditor } from './rich-text-editor'
import { Button } from './button'
import { Edit, Save, X } from 'lucide-react'

interface EditableTextProps {
  children?: React.ReactNode
  initialContent?: string
  onSave?: (content: string) => void
  className?: string
  editMode?: boolean
}

export const EditableText: React.FC<EditableTextProps> = ({
  children,
  initialContent = '',
  onSave,
  className = '',
  editMode = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent)

  const handleSave = () => {
    onSave?.(content)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setContent(initialContent)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={`border rounded-lg p-3 bg-white shadow-sm ${className}`}>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Edit content..."
          minHeight="100px"
        />
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative ${className}`}>
      {content ? (
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="prose prose-sm max-w-none">{children}</div>
      )}
      {editMode && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
} 