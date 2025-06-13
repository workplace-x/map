import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { EditableText } from '@/components/ui/editable-text'
import { ScaleControl } from '@/components/ui/scale-control'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleLeft, ToggleRight } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/editable-demo')({
  component: EditableDemo,
})

function EditableDemo() {
  const [editMode, setEditMode] = useState(false)
  const [pageData, setPageData] = useState({
    title: '<h1>Welcome to Our Platform</h1>',
    subtitle: '<p class="text-gray-600">This is a subtitle that can be edited</p>',
    description: '<p>This is a sample description that demonstrates in-place editing. <strong>Bold text</strong> and <em>italic text</em> are supported!</p>',
    benefits: '<ul><li>Easy to use interface</li><li>Rich text editing capabilities</li><li>Real-time updates</li></ul>'
  })

  const handleSave = (key: string) => (content: string) => {
    setPageData(prev => ({ ...prev, [key]: content }))
    console.log(`Saved ${key}:`, content)
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header with Scale Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-2">📝 In-Place Editing Demo</h1>
          <p className="text-gray-600">Toggle edit mode to make content editable</p>
        </div>
        <div className="lg:col-span-1">
          <ScaleControl className="h-fit" />
        </div>
      </div>

      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold">Content Editor</h2>
          <p className="text-gray-600">Experience in-place editing with Tiptap</p>
        </div>
        <Button
          variant={editMode ? "default" : "outline"}
          onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-2"
        >
          {editMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </Button>
      </div>

      {/* Editable Content */}
      <div className="space-y-6">
        <EditableText
          initialContent={pageData.title}
          onSave={handleSave('title')}
          editMode={editMode}
          className="mb-4"
        />

        <EditableText
          initialContent={pageData.subtitle}
          onSave={handleSave('subtitle')}
          editMode={editMode}
          className="mb-6"
        />

        <Card>
          <CardHeader>
            <CardTitle>About This Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableText
              initialContent={pageData.description}
              onSave={handleSave('description')}
              editMode={editMode}
              className="mb-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <EditableText
              initialContent={pageData.benefits}
              onSave={handleSave('benefits')}
              editMode={editMode}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">How to Edit Content</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Toggle Edit Mode</strong> - Click the button above to enable editing</li>
                <li><strong>Hover to Edit</strong> - Hover over content to see edit buttons</li>
                <li><strong>Click Edit</strong> - Click the edit icon to start editing with Tiptap</li>
                <li><strong>Rich Formatting</strong> - Use the toolbar for bold, italic, lists, etc.</li>
                <li><strong>Save Changes</strong> - Click Save to persist your changes</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Scale Control Features</CardTitle>
            </CardHeader>
            <CardContent className="text-green-700">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>80% Default</strong> - More compact view shows more content</li>
                <li><strong>Slider Control</strong> - Adjust from 50% to 150% scale</li>
                <li><strong>Quick Presets</strong> - Compact (70%), Normal (80%), Large (100%)</li>
                <li><strong>Persistent</strong> - Your preferred scale is saved locally</li>
                <li><strong>Responsive</strong> - Automatically adjusts on mobile devices</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Current Data Preview */}
      {editMode && (
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle>🔍 Current Data (for debugging)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
              {JSON.stringify(pageData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 