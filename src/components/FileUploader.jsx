import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * Reusable file uploader with drag & drop (desktop) and tap-to-select (mobile)
 * @param {Object} props
 * @param {string[]} props.accept - Accepted extensions e.g. ['.csv', '.pdf']
 * @param {number} [props.maxSize=10485760] - Max file size in bytes (default 10MB)
 * @param {function} props.onFileSelect - Called with File when valid file selected
 * @param {function} [props.onError] - Called with error message string
 * @param {boolean} [props.disabled] - Disable the uploader
 */
export default function FileUploader({ accept = [], maxSize = 10 * 1024 * 1024, onFileSelect, onError, disabled }) {
    const isMobile = useIsMobile();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const acceptString = accept.join(',');

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function validateFile(file) {
        if (accept.length > 0) {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!accept.some(a => a.toLowerCase() === ext)) {
                const msg = `Tipo não aceito. Use: ${accept.join(', ')}`;
                onError?.(msg);
                return false;
            }
        }
        if (file.size > maxSize) {
            const msg = `Arquivo muito grande. Máximo: ${formatSize(maxSize)}`;
            onError?.(msg);
            return false;
        }
        return true;
    }

    function handleFile(file) {
        if (!validateFile(file)) return;
        setSelectedFile(file);
        onFileSelect?.(file);
        // Haptic feedback on mobile
        if (isMobile && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    function handleInputChange(e) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    }

    function handleRemove(e) {
        e.stopPropagation();
        setSelectedFile(null);
        onFileSelect?.(null);
    }

    // Drag handlers (desktop only)
    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }

    return (
        <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            onDragEnter={!isMobile ? handleDragEnter : undefined}
            onDragOver={!isMobile ? handleDragOver : undefined}
            onDragLeave={!isMobile ? handleDragLeave : undefined}
            onDrop={!isMobile ? handleDrop : undefined}
            style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '32px 20px',
                textAlign: 'center',
                background: isDragging ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
            }}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept={acceptString}
                style={{ display: 'none' }}
                disabled={disabled}
            />

            {selectedFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <FileText size={24} color="var(--primary)" />
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                            {selectedFile.name}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            {formatSize(selectedFile.size)}
                        </p>
                    </div>
                    <button
                        onClick={handleRemove}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <X size={14} color="var(--danger)" />
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '12px',
                        background: 'var(--bg-card)',
                        borderRadius: '50%',
                        color: 'var(--primary)',
                    }}>
                        <UploadCloud size={32} />
                    </div>
                    <div>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                            {isMobile ? 'Toque para selecionar um arquivo' : 'Arraste ou clique para selecionar'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Aceita: {accept.join(', ')} &middot; Máx: {formatSize(maxSize)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
