import { type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={clsx('rounded-lg border border-gray-800 bg-gray-900/50 text-card-foreground shadow', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={clsx('text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={clsx('text-sm text-gray-400', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      className={clsx('p-6 pt-0', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
