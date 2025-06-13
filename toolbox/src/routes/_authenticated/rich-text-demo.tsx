import { createFileRoute } from '@tanstack/react-router'
import { RichTextExample } from '@/components/ui/rich-text-example'

export const Route = createFileRoute('/_authenticated/rich-text-demo')({
  component: RichTextDemo,
})

function RichTextDemo() {
  return <RichTextExample />
} 