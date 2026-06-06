import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'outline';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}
export declare function Button({ variant, className, children, ...props }: ButtonProps): import("react/jsx-runtime").JSX.Element;
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
export declare function Input({ label, className, ...props }: InputProps): import("react/jsx-runtime").JSX.Element;
interface CardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}
export declare function Card({ title, children, className }: CardProps): import("react/jsx-runtime").JSX.Element;
interface RangeGridProps {
    selectedHands: Set<string>;
    onToggle: (hand: string) => void;
}
export declare function RangeGrid({ selectedHands, onToggle }: RangeGridProps): import("react/jsx-runtime").JSX.Element;
interface EquityBarProps {
    value: number;
    label?: string;
}
export declare function EquityBar({ value, label }: EquityBarProps): import("react/jsx-runtime").JSX.Element;
interface StrategyMatrixProps {
    data: Record<string, {
        raise: number;
        call: number;
        fold: number;
    }>;
}
export declare function StrategyMatrix({ data }: StrategyMatrixProps): import("react/jsx-runtime").JSX.Element;
export {};
