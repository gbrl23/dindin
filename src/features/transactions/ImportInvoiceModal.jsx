import React, { useState } from 'react';
import { X, FileText, CheckCircle, AlertCircle, Calendar, Clipboard } from 'lucide-react';
import { useCards } from '../../hooks/useCards';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { useProfiles } from '../../hooks/useProfiles';
import { useImportLogs } from '../../hooks/useImportLogs';
import FileUploader from '../../components/FileUploader';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function ImportInvoiceModal({ isOpen, onClose }) {
    const { cards, loading: cardsLoading } = useCards();
    const { addTransactionsBulk } = useTransactions();
    const { user } = useAuth();
    const { profiles } = useProfiles();
    const { createLog } = useImportLogs();
    const [selectedCardId, setSelectedCardId] = useState('');
    const [file, setFile] = useState(null);

    // Tab State
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
    const [pastedText, setPastedText] = useState('');

    // Process State
    const [step, setStep] = useState('upload'); // 'upload' | 'preview'
    const [parsedItems, setParsedItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [processing, setProcessing] = useState(false);

    if (!isOpen) return null;

    // -- Handlers --

    const handleProcess = async () => {
        if (!selectedCardId) return;

        setProcessing(true);

        try {
            let items = [];

            if (activeTab === 'upload') {
                if (!file) return;
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    items = await parseCSV(file);
                } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    items = await parsePDF(file);
                } else {
                    alert('Formato não suportado. Tente CSV ou PDF.');
                    setProcessing(false);
                    return;
                }
            } else if (activeTab === 'paste') {
                if (!pastedText.trim()) {
                    alert('Por favor, cole o texto da fatura.');
                    setProcessing(false);
                    return;
                }
                items = parseText(pastedText);
            }

            if (items.length === 0) {
                alert('Nenhum dado encontrado. Verifique o formato.');
                setProcessing(false);
                return;
            }

            setParsedItems(items);
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
        let targetMonth = m;
        let targetYear = y;

        if (d >= closingDay) {
            targetMonth++;
            if (targetMonth > 12) {
                targetMonth = 1;
                targetYear++;
            }
        }

        return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    };

    const handleConfirmImport = async () => {
        if (selectedItems.size === 0) return;

        setProcessing(true);
        try {
            const itemsToImport = parsedItems.filter(i => selectedItems.has(i.id));
            const myProfile = profiles.find(p => p.user_id === user?.id);
            const selectedCard = cards.find(c => c.id === selectedCardId);

            if (!myProfile) {
                alert('Erro: Perfil de usuário não encontrado.');
                setProcessing(false);
                return;
            }

            const totalAmount = itemsToImport.reduce((sum, i) => sum + i.amount, 0);
            const importType = file?.name?.endsWith('.pdf') ? 'pdf' : 'csv';
            const filename = file?.name || 'texto-colado';

            // Create import log for traceability
            const log = await createLog(importType, filename, itemsToImport.length, totalAmount, selectedCardId);

            const payload = itemsToImport.map(item => ({
                description: item.description,
                amount: item.amount,
                date: item.date,
                invoice_date: getInvoiceDate(item.date, selectedCard?.closing_day),
                type: 'expense',
                card_id: selectedCardId,
                payer_id: myProfile.id,
                is_paid: false,
                import_id: log?.id || null,
            }));

            await addTransactionsBulk(payload);

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

    const parseCSV = (csvFile) => {
        return new Promise((resolve, reject) => {
            Papa.parse(csvFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const items = results.data.map((row, index) => {
                        const date = row['date'] || row['data'] || row['Data'] || row['Date'] || Object.values(row)[0];
                        const desc = row['description'] || row['descrição'] || row['historico'] || row['Estabelecimento'] || Object.values(row)[1];
                        const amountStr = row['amount'] || row['valor'] || row['Valor'] || Object.values(row)[Object.values(row).length - 1];

                        let amount = 0;
                        if (amountStr) {
                            let clean = amountStr.toString().replace('R$', '').trim();
                            if (clean.includes(',') && clean.includes('.')) {
                                clean = clean.replace(/\./g, '').replace(',', '.');
                            } else if (clean.includes(',')) {
                                clean = clean.replace(',', '.');
                            }
                            amount = parseFloat(clean);
                        }

                        let dateISO = new Date().toISOString().split('T')[0];
                        if (date && date.includes('/')) {
                            const [d, m, y] = date.split('/');
                            const year = y && y.length === 4 ? y : new Date().getFullYear();
                            dateISO = `${year}-${m}-${d}`;
                        } else if (date) {
                            try { dateISO = new Date(date).toISOString().split('T')[0]; } catch { }
                        }

                        return {
                            id: index,
                            date: dateISO,
                            description: desc || 'Sem descrição',
                            amount: Math.abs(amount) || 0
                        };
                    }).filter(i => i.amount > 0);
                    resolve(items);
                },
                error: (err) => reject(err)
            });
        });
    };

    const parsePDF = async (pdfFile) => {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return parseText(fullText);
    };

    const parseText = (text) => {
        const items = [];
        const regexBR = /(\d{2}\/\d{2})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})/g;

        let match;
        let idCounter = 0;

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
        if (dateStr.includes('/')) {
            const [d, m] = dateStr.split('/');
            const year = new Date().getFullYear();
            dateISO = `${year}-${m}-${d}`;
        }

        let amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));

        return { id, date: dateISO, description: desc, amount };
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
            <div className="card custom-scroll" style={{
                width: '100%', maxWidth: '500px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                animation: 'slideUp 0.3s ease-out',
                overflowY: 'auto',
                maxHeight: '85vh',
                scrollbarGutter: 'stable'
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
                                <FileUploader
                                    accept={['.pdf', '.csv']}
                                    maxSize={10 * 1024 * 1024}
                                    onFileSelect={setFile}
                                    onError={(msg) => alert(msg)}
                                />
                            </div>
                        ) : (
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

                        <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', maxHeight: '400px', scrollbarGutter: 'stable' }}>
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
