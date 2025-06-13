import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconSearch } from '@tabler/icons-react'

interface SearchSectionProps {
  searchValue: string
  onSearchValueChange: (value: string) => void
  onSearch: () => void
  loading: boolean
}

export function SearchSection({
  searchValue,
  onSearchValueChange,
  onSearch,
  loading
}: SearchSectionProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <div className='flex gap-4'>
      <Input
        placeholder='Enter order number...'
        value={searchValue}
        onChange={(e) => onSearchValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <Button onClick={onSearch} disabled={loading || !searchValue.trim()}>
        <IconSearch className='mr-2 h-4 w-4' />
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </div>
  )
} 