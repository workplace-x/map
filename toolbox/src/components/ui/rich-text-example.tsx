import React, { useState } from 'react'
import { RichTextEditor } from './rich-text-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

export const RichTextExample: React.FC = () => {
  const [content, setContent] = useState<string>('<p>Try editing this text!</p>')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rich Text Editor Example</CardTitle>
          <CardDescription>
            This example shows how to use the Tiptap WYSIWYG editor component.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start typing your content here..."
            className="mb-4"
            minHeight="300px"
          />
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">HTML Output:</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm">
              {content}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Read-Only Example</CardTitle>
          <CardDescription>
            Example of the editor in read-only mode without the toolbar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content="<h2>Read-Only Content</h2><p>This editor is <strong>read-only</strong> and doesn't show the toolbar. You can use this for displaying formatted content.</p><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>"
            editable={false}
            className="mb-4"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default RichTextExample 