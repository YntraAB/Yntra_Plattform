import React, { createContext, useContext, useState, type ReactNode } from 'react'

export interface DynamicBreadcrumbItem {
  label: string
  path?: string
  onClick?: () => void
}

interface BreadcrumbContextType {
  dynamicBreadcrumbs: DynamicBreadcrumbItem[]
  setDynamicBreadcrumbs: (breadcrumbs: DynamicBreadcrumbItem[]) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export const BreadcrumbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dynamicBreadcrumbs, setDynamicBreadcrumbsState] = useState<DynamicBreadcrumbItem[]>([])

  const setDynamicBreadcrumbs = React.useCallback((breadcrumbs: DynamicBreadcrumbItem[]) => {
    setDynamicBreadcrumbsState((prev) => {
      if (prev.length !== breadcrumbs.length) return breadcrumbs
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].label !== breadcrumbs[i].label || prev[i].path !== breadcrumbs[i].path) {
          return breadcrumbs
        }
      }
      return prev
    })
  }, [])

  return (
    <BreadcrumbContext.Provider value={{ dynamicBreadcrumbs, setDynamicBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export const useBreadcrumbContext = () => {
  const context = useContext(BreadcrumbContext)
  if (context === undefined) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider')
  }
  return context
}
