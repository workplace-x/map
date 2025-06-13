import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { uploadFileWithProgress } from '@/lib/api-client'
import { FileIcon, defaultStyles } from 'react-file-icon'
import { X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv'

interface FileUploadStatus {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface RFPUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: () => void
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return (
    <div className="w-8 h-8">
      <FileIcon extension={ext} {...defaultStyles[ext]} />
    </div>
  )
}

export function RFPUploadDialog({ open, onOpenChange, onUploadSuccess }: RFPUploadDialogProps) {
  const [files, setFiles] = useState<FileUploadStatus[]>([])
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [backendResults, setBackendResults] = useState<any[]>([])

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const newFiles: FileUploadStatus[] = Array.from(fileList)
      .filter(file => ACCEPTED_TYPES.includes(file.name.split('.').pop()?.toLowerCase() || ''))
      .map(file => ({ file, progress: 0, status: 'pending' }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    setUploading(true)
    setSummary({ success: 0, failed: 0 })
    setBackendResults([])
    const updatedFiles = [...files]
    let success = 0
    let failed = 0
    await Promise.all(
      updatedFiles.map(async (fileStatus, idx) => {
        if (fileStatus.status === 'success') return
        updatedFiles[idx].status = 'uploading'
        setFiles([...updatedFiles])
        try {
          const response = await uploadFileWithProgress('/api/rfp-gpt/upload', fileStatus.file, (progress) => {
            updatedFiles[idx].progress = progress
            setFiles([...updatedFiles])
          })
          if (response && response.results && Array.isArray(response.results)) {
            setBackendResults(prev => [...prev, ...response.results])
          }
          updatedFiles[idx].status = 'success'
          success++
        } catch (error) {
          updatedFiles[idx].status = 'error'
          updatedFiles[idx].error = error instanceof Error ? error.message : 'Upload failed'
          failed++
        }
        setFiles([...updatedFiles])
      })
    )
    setSummary({ success, failed })
    setUploading(false)
    if (success > 0 && onUploadSuccess) onUploadSuccess()
  }

  const handleRemove = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleRetry = async (idx: number) => {
    const updatedFiles = [...files]
    updatedFiles[idx].status = 'pending'
    updatedFiles[idx].progress = 0
    updatedFiles[idx].error = undefined
    setFiles(updatedFiles)
    await handleUpload()
  }

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFiles([])
      setUploading(false)
      setSummary({ success: 0, failed: 0 })
      setIsDragging(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload RFP Documents</DialogTitle>
        </DialogHeader>
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/50 hover:bg-muted'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowse}
          style={{ minHeight: 160 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Drag and drop files here</p>
              <p className="text-xs mt-1">or click to browse</p>
              <p className="text-xs mt-2 text-muted-foreground/70">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV
              </p>
            </div>
          </div>
        </div>
        {files.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-auto mb-4 pr-2">
            {files.map((fileStatus, idx) => (
              <div 
                key={fileStatus.file.name + idx} 
                className="flex items-center gap-3 p-3 bg-background rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {getFileIcon(fileStatus.file.name)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{fileStatus.file.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(fileStatus.file.size)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1">
                      <Progress value={fileStatus.progress} className="h-1" />
                    </div>
                    <div className="text-xs">
                      {fileStatus.status === 'pending' && 'Pending'}
                      {fileStatus.status === 'uploading' && `${fileStatus.progress}%`}
                      {fileStatus.status === 'success' && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      )}
                      {fileStatus.status === 'error' && (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                  {fileStatus.error && (
                    <p className="text-xs text-red-600 mt-1">{fileStatus.error}</p>
                  )}
                </div>
                {fileStatus.status === 'error' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleRetry(idx)} 
                    disabled={uploading}
                    className="shrink-0"
                  >
                    Retry
                  </Button>
                )}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleRemove(idx)} 
                  disabled={uploading}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {summary.success + summary.failed > 0 && (
          <div className="mb-4 text-sm flex items-center gap-2">
            {summary.success > 0 && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {summary.success} uploaded
              </span>
            )}
            {summary.failed > 0 && (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {summary.failed} failed
              </span>
            )}
          </div>
        )}
        {backendResults.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Processing Results</h4>
            <div className="space-y-2">
              {backendResults.map(result => (
                <div key={result.filename} className="p-2 border rounded bg-muted/50">
                  <div><span className="font-medium">{result.filename}</span>: <span className={result.status === 'success' ? 'text-green-600' : result.status === 'error' ? 'text-red-600' : 'text-yellow-600'}>{result.status}</span></div>
                  {typeof result.chunks === 'number' && <div>Chunks: {result.chunks}</div>}
                  {result.failed_chunks > 0 && <div className="text-yellow-600">Failed Chunks: {result.failed_chunks}</div>}
                  {result.error && <div className="text-red-600">Error: {result.error}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        <Button
          type="button"
          className="w-full"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Uploading...' : 'Upload All Files'}
        </Button>
      </DialogContent>
    </Dialog>
  )
} 