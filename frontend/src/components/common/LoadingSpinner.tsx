import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn('animate-spin text-primary-600', sizeClasses[size], className)} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card px-8 py-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
          <LoadingSpinner size="lg" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Loading workspace</p>
        <p className="mt-1 text-sm text-slate-500">Please wait a moment...</p>
      </div>
    </div>
  )
}
