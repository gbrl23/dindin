import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Calendar, DollarSign, Edit2, Trash2, Clipboard } from 'lucide-react';
import { useCards } from '../../hooks/useCards';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { useProfiles } from '../../hooks/useProfiles';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function ImportInvoiceModal({ isOpen, onClose }) {
    const { cards, loading: cardsLoading } = useCards();
    const { addTransaction } = useTransactions();
    const { user } = useAuth();
    const { profiles } = useProfiles();
    const [selectedCardId, setSelectedCardId] = useState('');
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
    const [pastedText, setPastedText] = useState('');

    // Process State
    const [step, setStep] = useState('upload'); // 'upload' | 'preview'
    const [parsedItems, setParsedItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Placeholder processing state
    const [processing, setProcessing] = useState(false);

    // Refs
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    // -- Handlers --

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndSetFile(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (uploadedFile) => {
        // Simple validation for now
        const validTypes = [
            'application/pdf',
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        // Accept common invoice formats
        // Note: CSV MIME type can vary, so checking extension is also good practice, but for UI mock validation:
        setFile(uploadedFile);
    };

    const handleProcess = async () => {
        if (!selectedCardId) return;

        setProcessing(true);

        try {
            let items = [];

            if (activeTab === 'upload') {
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    items = await parseCSV(file);
                } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    items = await parsePDF(file);
                } else {
                    alert('Formato não suportado automaticamente ainda. Tente CSV ou PDF.');
                    setProcessing(false);
                    return;
                }
            } else if (activeTab === 'paste') {
                if (!pastedText.trim()) {
                    alert('Por favor, cole o texto da fatura.');
                    setProcessing(false);
                    return;
                }
                items = await parseText(pastedText);
            }

            if (items.length === 0) {
                alert('Nenhum dado encontrado no arquivo. Verifique o formato.');
                setProcessing(false);
                return;
            }

            setParsedItems(items);
            // Select all by default
            setSelectedItems(new Set(items.map(i => i.id)));
            setStep('preview');
        } catch (error) {
            console.error(error);
            alert('Erro ao ler arquivo: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const getInvoiceDate = (transactionDateISO, closingDay) => {
        if (!closingDay) return transactionDateISO;

        const [y, m, d] = transactionDateISO.split('-').map(Number);
        // Create date object (UTC or local handled carefully, here Input is YYYY-MM-DD so let's treat as local components)

        let targetMonth = m;
        let targetYear = y;

        // Regra: dia < fechamento → fatura do mês atual
        //        dia >= fechamento → fatura do mês seguinte
        if (d >= closingDay) {
            targetMonth++;
            if (targetMonth > 12) {
                targetMonth = 1;
                targetYear++;
            }
        }

        // Return first day of the invoice month usually? Or keep the same day but shifted?
        // Ideally we want to know "Which Invoice" -> "April 2026".
        // But the field is `invoice_date` (Date).
        // Convention: First day of the invoice month? Or same day next month?
        // Let's use: First day of the invoice month to group easily.
        // OR: Keep original date but `invoice_date` logic shifts.
        // Let's set it to the 1st of the target month to be safe and consistent for grouping.
        return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    };

    const handleConfirmImport = async () => {
        if (selectedItems.size === 0) return;

        setProcessing(true);
        try {
            const itemsToImport = parsedItems.filter(i => selectedItems.has(i.id));

            // Loop sequential to avoid race conditions likely, or Promise.all if atomic RPC supported
            // Using Promise.all for speed, backend should handle concurrency
            const myProfile = profiles.find(p => p.user_id === user?.id);
            const selectedCard = cards.find(c => c.id === selectedCardId);

            if (!myProfile) {
                alert('Erro: Perfil de usuário não encontrado.');
                setProcessing(false);
                return;
            }

            const promises = itemsToImport.map(item => {
                return addTransaction({
                    description: item.description,
                    amount: item.amount,
                    date: item.date, // YYYY-MM-DD
                    invoice_date: getInvoiceDate(item.date, selectedCard?.closing_day), // Calculate Invoice Month
                    type: 'expense',
                    card_id: selectedCardId,
                    payer_id: myProfile.id,
                    installments: '1', // Default to 1x for imports for now
                    // Group: Default to personal or None
                    is_paid: false // Explicitly unpaid
                });
            });

            await Promise.all(promises);

            alert(`${itemsToImport.length} gastos importados com sucesso!`);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar gastos: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };


    // --- PARSERS ---

    const parseCSV = (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const items = results.data.map((row, index) => {
                        // Heuristic: Find likely columns based on common names or content
                        // Needs strict column mapping usually, but let's try generic fallback
                        const date = row['date'] || row['data'] || row['Data'] || row['Date'] || Object.values(row)[0];
                        const desc = row['description'] || row['descrição'] || row['historico'] || row['Estabelecimento'] || Object.values(row)[1];
                        const amountStr = row['amount'] || row['valor'] || row['Valor'] || Object.values(row)[row.length - 1]; // Often last

                        let amount = 0;
                        if (amountStr) {
                            // Normalize: 1.234,56 -> 1234.56
                            let clean = amountStr.toString().replace('R$', '').trim();
                            if (clean.includes(',') && clean.includes('.')) {
                                // 1.234,56 -> remove . replace ,
                                clean = clean.replace(/\./g, '').replace(',', '.');
                            } else if (clean.includes(',')) {
                                clean = clean.replace(',', '.');
                            }
                            amount = parseFloat(clean);
                        }

                        // Date Normalize (DD/MM/YYYY -> YYYY-MM-DD)
                        let dateISO = new Date().toISOString().split('T')[0];
                        if (date && date.includes('/')) {
                            const [d, m, y] = date.split('/');
                            const year = y && y.length === 4 ? y : new Date().getFullYear();
                            dateISO = `${year}-${m}-${d}`;
                        } else if (date) {
                            // Try parsing standard
                            try { dateISO = new Date(date).toISOString().split('T')[0]; } catch { }
                        }

                        return {
                            id: index,
                            date: dateISO,
                            description: desc || 'Sem descrição',
                            amount: Math.abs(amount) || 0 // Default to positive expense
                        };
                    }).filter(i => i.amount > 0); // Remove zero entries
                    resolve(items);
                },
                error: (err) => reject(err)
            });
        });
    };

    const parsePDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        // Regex for Nubank style: "12 JAN Uber *Trip 15.90"
        // Generic Regex attempts
        const items = [];
        // Regex: Date (DD MMM) + Desc + Amount (1,234.56 or 1234,56)
        // Adjust for common formats
        // 1. DD/MM Description 1.234,56
        const regexBR = /(\d{2}\/\d{2})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g;
        // 2. DD MMM Description 123.45 (Nubank often)
        const regexNubank = /(\d{2}\s+[A-Z]{3})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/gi;

        let match;
        let idCounter = 0;

        // Try BR first
        while ((match = regexBR.exec(fullText)) !== null) {
            items.push(formatMatch(match, idCounter++));
        }

        // If few items, try Nubank style or others
        if (items.length < 2) {
            // Very naive loop over reasonable lines
            // TODO: Improve this with specific Bank strategies later
        }

        return items; // Fallback empty for now if regex fails, user manual entry later
    };

    const parseText = async (text) => {
        // Reuse the logic from PDF parsing for raw text
        const items = [];
        const regexBR = /(\d{2}\/\d{2})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g;
        // 2. DD MMM Description 123.45 (Nubank often)
        const regexNubank = /(\d{2}\s+[A-Z]{3})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/gi;

        let match;
        let idCounter = 0;

        // Try BR first
        while ((match = regexBR.exec(text)) !== null) {
            items.push(formatMatch(match, idCounter++));
        }

        return items;
    };

    const formatMatch = (match, id) => {
        const dateStr = match[1];
        const desc = match[2].trim();
        const amountStr = match[3];

        let dateISO = new Date().toISOString().split('T')[0];
        // Handle DD/MM
        if (dateStr.includes('/')) {
            const [d, m] = dateStr.split('/');
            const year = new Date().getFullYear(); // Assume current year (dangerous for Dec/Jan boundary, fix logic later)
            dateISO = `${year}-${m}-${d}`;
        }

        let amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));

        return {
            id,
            date: dateISO,
            description: desc,
            amount
        };
    };

    const toggleItem = (id) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const toggleAll = () => {
        if (selectedItems.size === parsedItems.length) setSelectedItems(new Set());
        else setSelectedItems(new Set(parsedItems.map(i => i.id)));
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{
                width: '100%', maxWidth: '500px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Importar Fatura</h2>
                    <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content based on Step */}
                {step === 'upload' ? (
                    <>
                        {/* 1. Card Selection */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Selecione o Cartão
                            </label>
                            <select
                                className="input"
                                value={selectedCardId}
                                onChange={e => setSelectedCardId(e.target.value)}
                                style={{ width: '100%' }}
                                disabled={cardsLoading}
                            >
                                <option value="">Selecione um cartão...</option>
                                {cards.map(card => (
                                    <option key={card.id} value={card.id}>{card.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <button
                                onClick={() => setActiveTab('upload')}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500',
                                    background: activeTab === 'upload' ? 'var(--primary)' : 'var(--bg-secondary)',
                                    color: activeTab === 'upload' ? 'white' : 'var(--text-secondary)',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                Upload Arquivo
                            </button>
                            <button
                                onClick={() => setActiveTab('paste')}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500',
                                    background: activeTab === 'paste' ? 'var(--primary)' : 'var(--bg-secondary)',
                                    color: activeTab === 'paste' ? 'white' : 'var(--text-secondary)',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                Colar Texto
                            </button>
                        </div>

                        {/* 2. Upload Area or Text Area */}
                        {activeTab === 'upload' ? (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Arquivo da Fatura (PDF, CSV, XLS)
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    style={{
                                        border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                                        borderRadius: '12px',
                                        padding: '32px',
                                        textAlign: 'center',
                                        background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                        accept=".csv,.pdf,.xls,.xlsx"
                                    />

                                    {file ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: 'var(--success)' }}>
                                                <FileText size={32} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{file.name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'transparent', marginTop: '8px' }}
                                            >
                                                Remover arquivo
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '50%', color: 'var(--primary)' }}>
                                                <UploadCloud size={32} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                    Clique ou arraste o arquivo aqui
                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                    Suporta PDF, CSV e Excel
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // PASTE AREA
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Cole o texto da fatura aqui (Ctrl+V)
                                </label>
                                <textarea
                                    className="input"
                                    value={pastedText}
                                    onChange={e => setPastedText(e.target.value)}
                                    placeholder={`Ex: \n01/01 Uber *Trip 20,00\n02/01 Netflix 55,90`}
                                    style={{ width: '100%', height: '180px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'none' }}
                                />
                            </div>
                        )}

                        {/* Footer Action */}
                        <button
                            onClick={handleProcess}
                            disabled={!selectedCardId || processing || (activeTab === 'upload' && !file) || (activeTab === 'paste' && !pastedText.trim())}
                            className="btn btn-primary"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: processing ? 0.7 : 1 }}
                        >
                            {processing ? 'Processando...' : (
                                <>{activeTab === 'upload' ? <FileText size={20} /> : <Clipboard size={20} />} {activeTab === 'upload' ? 'Ler Arquivo' : 'Ler Texto'}</>
                            )}
                        </button>
                    </>
                ) : (
                    // --- PREVIEW STEP ---
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Encontrados: <b>{parsedItems.length}</b> | Selecionados: <b>{selectedItems.size}</b>
                            </div>
                            <button onClick={toggleAll} style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'transparent', textDecoration: 'underline' }}>
                                {selectedItems.size === parsedItems.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', maxHeight: '400px' }}>
                            {parsedItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                        background: selectedItems.has(item.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--text-secondary)',
                                        background: selectedItems.has(item.id) ? 'var(--primary)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                    }}>
                                        {selectedItems.has(item.id) && <CheckCircle size={14} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{item.description}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12} /> {new Date(item.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                            <button
                                onClick={() => setStep('upload')}
                                className="btn"
                                style={{ flex: 1, background: 'var(--bg-secondary)' }}
                                disabled={processing}
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                                disabled={selectedItems.size === 0 || processing}
                            >
                                {processing ? 'Importando...' : `Confirmar Importação (${selectedItems.size})`}
                            </button>
                        </div>
                    </div>
                )}

                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Nenhum dado é salvo até sua confirmação final.
                </p>
            </div>
        </div>
    );
}
