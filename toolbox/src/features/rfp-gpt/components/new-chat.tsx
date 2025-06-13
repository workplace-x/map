import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRFP } from '../context/rfp-context'
import { useAuth } from '@/stores/authStore'

interface NewChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewChat({ open, onOpenChange }: NewChatProps) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createChat } = useRFP()
  const { accessToken } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return

    setUploading(true)
    setError(null)

    try {
      // First upload the file
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch('/api/rfp-gpt/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file')
      }

      const { documentUrl } = await uploadRes.json()
      
      // Then create the chat
      await createChat(title, documentUrl)
      
      // Close dialog and reset form
      onOpenChange(false)
      setTitle('')
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New RFP Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">RFP Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter RFP title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">RFP Document</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!file || !title || uploading}
          >
            {uploading ? 'Creating Chat...' : 'Start Chat'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 