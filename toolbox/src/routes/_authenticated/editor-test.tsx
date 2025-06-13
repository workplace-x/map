import { createFileRoute } from '@tanstack/react-router'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useState } from 'react'

export const Route = createFileRoute('/_authenticated/editor-test')({
  component: EditorTest,
})

function EditorTest() {
  const [content, setContent] = useState('<p>Hello from Tiptap! <strong>Bold text</strong> and <em>italic text</em>.</p>')

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🎨 Tiptap Editor Test</h1>
      
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Rich Text Editor</h2>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Type something here to test the editor..."
          minHeight="200px"
        />
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Live HTML Output:</h3>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
          {content}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">✅ What You Should See:</h3>
        <ul className="text-blue-700 space-y-1">
          <li>• Toolbar with Bold, Italic, Underline, etc. buttons</li>
          <li>• Editable text area with the sample content</li>
          <li>• Buttons should highlight when you select formatted text</li>
          <li>• HTML output should update as you type</li>
        </ul>
      </div>
    </div>
  )
} 