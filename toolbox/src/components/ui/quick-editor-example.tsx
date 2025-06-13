import React, { useState } from 'react'
import { RichTextEditor } from './rich-text-editor'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export const QuickEditorExample: React.FC = () => {
  const [content, setContent] = useState('<p>Start typing here...</p>')

  const handleSave = () => {
    console.log('Saving content:', content)
    alert('Content saved! Check console for HTML output.')
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quick Editor Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Type your content here..."
          minHeight="200px"
        />
        
        <div className="flex gap-2">
          <Button onClick={handleSave}>Save Content</Button>
          <Button variant="outline" onClick={() => setContent('<p>Reset content</p>')}>
            Reset
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          <strong>Character count:</strong> {content.replace(/<[^>]*>/g, '').length}
        </div>
      </CardContent>
    </Card>
  )
} 