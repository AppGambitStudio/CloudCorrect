"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({});
    const resolveRef = useRef<(value: boolean) => void>(() => { });

    const confirm = useCallback((confirmOptions: ConfirmOptions) => {
        setOptions(confirmOptions);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef.current(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef.current(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) handleCancel();
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{options.title || 'Confirm Action'}</DialogTitle>
                        <DialogDescription>
                            {options.message || 'Are you sure you want to proceed?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex space-x-2 justify-end">
                        <Button variant="outline" onClick={handleCancel}>
                            {options.cancelText || 'Cancel'}
                        </Button>
                        <Button
                            variant={options.variant || 'default'}
                            onClick={handleConfirm}
                            className={options.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {options.confirmText || 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
}
