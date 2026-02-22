import React, { useState, useMemo } from 'react';
import { ArrowLeft, FileSpreadsheet, ArrowRight, CheckCircle, AlertCircle, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import FileUploader from '../../components/FileUploader';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useProfiles } from '../../hooks/useProfiles';
import { useImportLogs } from '../../hooks/useImportLogs';

const FIELD_OPTIONS = [
    { value: 'ignore', label: 'Ignorar' },
    { value: 'date', label: 'Data' },
    { value: 'description', label: 'Descrição' },
    { value: 'amount', label: 'Valor' },
    { value: 'category', label: 'Categoria' },
    { value: 'type', label: 'Tipo' },
];

const STEPS = { UPLOAD: 'upload', MAPPING: 'mapping', PREVIEW: 'preview', RESULT: 'result' };

export default function ImportCsvView() {
    const navigate = useNavigate();
    const { addTransactionsBulk } = useTransactions();
    const { categories } = useCategories();
    const { myProfile } = useProfiles();
    const { createLog, undoImport } = useImportLogs();

    const [step, setStep] = useState(STEPS.UPLOAD);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    // CSV parse state
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvRows, setCsvRows] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});

    // Result state
    const [importResult, setImportResult] = useState(null);

    // ---- STEP 1: File Upload ----
    const handleFileSelect = (f) => {
        setFile(f);
        setError('');
    };

    const handleParseFile = async () => {
        if (!file) return;
        setProcessing(true);
        setError('');

        try {
            const text = await readFileText(file);
            const result = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false,
            });

            if (result.errors.length > 0 && result.data.length === 0) {
                setError('Erro ao ler CSV: ' + result.errors[0].message);
                setProcessing(false);
                return;
            }

            const headers = result.meta.fields || [];
            if (headers.length === 0) {
                setError('Nenhuma coluna encontrada no CSV.');
                setProcessing(false);
                return;
            }

            setCsvHeaders(headers);
            setCsvRows(result.data);

            // Auto-detect column mapping
            const mapping = autoDetectMapping(headers);
            setColumnMapping(mapping);
            setStep(STEPS.MAPPING);
        } catch (err) {
            setError('Erro ao processar arquivo: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    // ---- STEP 2: Column Mapping ----
    const handleMappingChange = (header, fieldValue) => {
        setColumnMapping(prev => ({ ...prev, [header]: fieldValue }));
    };

    const mappingValid = useMemo(() => {
        const values = Object.values(columnMapping);
        return values.includes('date') && values.includes('description') && values.includes('amount');
    }, [columnMapping]);

    const previewRows = useMemo(() => {
        if (csvRows.length === 0) return [];
        return buildMappedRows(csvRows.slice(0, 5), columnMapping, csvHeaders, categories);
    }, [csvRows, columnMapping, csvHeaders, categories]);

    // ---- STEP 3: Preview & Import ----
    const allMappedRows = useMemo(() => {
        if (step !== STEPS.PREVIEW) return [];
        return buildMappedRows(csvRows, columnMapping, csvHeaders, categories);
    }, [step, csvRows, columnMapping, csvHeaders, categories]);

    const validRows = useMemo(() => allMappedRows.filter(r => r.valid), [allMappedRows]);
    const invalidRows = useMemo(() => allMappedRows.filter(r => !r.valid), [allMappedRows]);

    const totalAmount = useMemo(() =>
        validRows.reduce((sum, r) => sum + r.amount, 0),
        [validRows]
    );

    const handleImport = async () => {
        if (validRows.length === 0 || !myProfile) return;
        setProcessing(true);

        try {
            // Create import log first
            const log = await createLog('csv', file.name, validRows.length, totalAmount);
            if (!log) throw new Error('Falha ao criar log de importação');

            // Build transaction payloads
            const payload = validRows.map(row => ({
                description: row.description,
                amount: row.amount,
                date: row.date,
                type: row.type,
                category_id: row.category_id || null,
                category: row.category_name || null,
                payer_id: myProfile.id,
                import_id: log.id,
                is_paid: false,
            }));

            await addTransactionsBulk(payload);

            setImportResult({
                importedCount: validRows.length,
                ignoredCount: invalidRows.length,
                totalAmount,
                logId: log.id,
            });
            setStep(STEPS.RESULT);
        } catch (err) {
            setError('Erro na importação: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleUndo = async () => {
        if (!importResult?.logId) return;
        setProcessing(true);
        try {
            const success = await undoImport(importResult.logId);
            if (success) {
                alert('Importação desfeita com sucesso!');
                navigate('/transactions');
            } else {
                alert('Erro ao desfazer importação.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '100px', maxWidth: '700px', margin: '0 auto' }}>
            {/* Header */}
            <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={() => {
                        if (step === STEPS.MAPPING) setStep(STEPS.UPLOAD);
                        else if (step === STEPS.PREVIEW) setStep(STEPS.MAPPING);
                        else navigate(-1);
                    }}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '50%',
                        padding: '10px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                        Importar CSV
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {step === STEPS.UPLOAD && 'Selecione o arquivo CSV'}
                        {step === STEPS.MAPPING && 'Mapeie as colunas do CSV'}
                        {step === STEPS.PREVIEW && `${validRows.length} transações prontas para importar`}
                        {step === STEPS.RESULT && 'Importação concluída!'}
                    </p>
                </div>
            </header>

            {/* Step Indicator */}
            {step !== STEPS.RESULT && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {['Upload', 'Mapear', 'Importar'].map((label, i) => {
                        const stepIndex = [STEPS.UPLOAD, STEPS.MAPPING, STEPS.PREVIEW].indexOf(step);
                        const isActive = i <= stepIndex;
                        return (
                            <div key={label} style={{ flex: 1 }}>
                                <div style={{
                                    height: '4px',
                                    borderRadius: '2px',
                                    background: isActive ? 'var(--primary)' : 'var(--border)',
                                    transition: 'background 0.3s',
                                    marginBottom: '4px'
                                }} />
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: isActive ? '600' : '400'
                                }}>{label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {error && (
                <div style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--danger)',
                    fontSize: '0.9rem'
                }}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* STEP: UPLOAD */}
            {step === STEPS.UPLOAD && (
                <div>
                    <FileUploader
                        accept={['.csv']}
                        maxSize={10 * 1024 * 1024}
                        onFileSelect={handleFileSelect}
                        onError={setError}
                    />
                    <button
                        className="btn btn-primary"
                        disabled={!file || processing}
                        onClick={handleParseFile}
                        style={{ width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <FileSpreadsheet size={18} />
                        {processing ? 'Lendo arquivo...' : 'Ler CSV'}
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Suporta UTF-8, ISO-8859-1 e separadores: vírgula, ponto e vírgula, tab
                    </p>
                </div>
            )}

            {/* STEP: MAPPING */}
            {step === STEPS.MAPPING && (
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {csvHeaders.map(header => (
                            <div
                                key={header}
                                className="card"
                                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{header}</span>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        Ex: {csvRows[0]?.[header] || '—'}
                                    </p>
                                </div>
                                <select
                                    className="input"
                                    value={columnMapping[header] || 'ignore'}
                                    onChange={e => handleMappingChange(header, e.target.value)}
                                    style={{ width: '140px', flexShrink: 0 }}
                                >
                                    {FIELD_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Mapping Preview */}
                    {previewRows.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Preview (primeiras {previewRows.length} linhas)
                            </h3>
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {previewRows.map((row, i) => (
                                    <div key={i} style={{
                                        padding: '10px 16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: i < previewRows.length - 1 ? '1px solid var(--border)' : 'none',
                                        opacity: row.valid ? 1 : 0.5,
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{row.description || '—'}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>{row.dateDisplay}</span>
                                        </div>
                                        <span style={{ fontWeight: '600', color: row.valid ? 'var(--text-primary)' : 'var(--danger)', flexShrink: 0 }}>
                                            {row.valid ? `R$ ${row.amount.toFixed(2).replace('.', ',')}` : row.error}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!mappingValid && (
                        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            Mapeie pelo menos: Data, Descrição e Valor
                        </p>
                    )}

                    <button
                        className="btn btn-primary"
                        disabled={!mappingValid}
                        onClick={() => setStep(STEPS.PREVIEW)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <ArrowRight size={18} />
                        Continuar para importação
                    </button>
                </div>
            )}

            {/* STEP: PREVIEW */}
            {step === STEPS.PREVIEW && (
                <div>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>{validRows.length}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Válidas</p>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: invalidRows.length > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{invalidRows.length}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Ignoradas</p>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                R$ {totalAmount.toFixed(2).replace('.', ',')}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Total</p>
                        </div>
                    </div>

                    {/* Transaction list */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                        {validRows.slice(0, 50).map((row, i) => (
                            <div key={i} style={{
                                padding: '10px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid var(--border)',
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{row.description}</span>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                                        <span>{row.dateDisplay}</span>
                                        {row.category_name && <span>· {row.category_name}</span>}
                                    </div>
                                </div>
                                <span style={{ fontWeight: '600', flexShrink: 0 }}>
                                    R$ {row.amount.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        ))}
                        {validRows.length > 50 && (
                            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                ... e mais {validRows.length - 50} transações
                            </div>
                        )}
                    </div>

                    <button
                        className="btn btn-primary"
                        disabled={validRows.length === 0 || processing}
                        onClick={handleImport}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <CheckCircle size={18} />
                        {processing ? 'Importando...' : `Importar ${validRows.length} transações`}
                    </button>
                </div>
            )}

            {/* STEP: RESULT */}
            {step === STEPS.RESULT && importResult && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <CheckCircle size={40} color="#22C55E" />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Importação concluída!</h2>

                    <div className="card" style={{ padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Transações importadas</span>
                            <span style={{ fontWeight: '600' }}>{importResult.importedCount}</span>
                        </div>
                        {importResult.ignoredCount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Ignoradas</span>
                                <span style={{ fontWeight: '600', color: 'var(--danger)' }}>{importResult.ignoredCount}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total importado</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                                R$ {importResult.totalAmount.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/transactions')}
                            style={{ width: '100%' }}
                        >
                            Ver Transações
                        </button>
                        <button
                            className="btn"
                            onClick={handleUndo}
                            disabled={processing}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: '1px solid var(--danger)',
                                color: 'var(--danger)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Undo2 size={16} />
                            {processing ? 'Desfazendo...' : 'Desfazer Importação'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- HELPERS ----

function readFileText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        // Try UTF-8 first; PapaParse handles BOM
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Auto-detect column mapping based on common header names
 */
export function autoDetectMapping(headers) {
    const mapping = {};
    const lower = headers.map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

    headers.forEach((header, i) => {
        const lh = lower[i];
        if (['data', 'date', 'dt', 'dia'].includes(lh)) {
            mapping[header] = 'date';
        } else if (['descricao', 'description', 'desc', 'historico', 'estabelecimento', 'lancamento', 'titulo'].includes(lh)) {
            mapping[header] = 'description';
        } else if (['valor', 'amount', 'value', 'vl', 'quantia', 'montante'].includes(lh)) {
            mapping[header] = 'amount';
        } else if (['categoria', 'category', 'cat'].includes(lh)) {
            mapping[header] = 'category';
        } else if (['tipo', 'type'].includes(lh)) {
            mapping[header] = 'type';
        } else {
            mapping[header] = 'ignore';
        }
    });

    return mapping;
}

/**
 * Build mapped rows from CSV data using column mapping
 */
export function buildMappedRows(rows, mapping, headers, categories = []) {
    const dateCol = headers.find(h => mapping[h] === 'date');
    const descCol = headers.find(h => mapping[h] === 'description');
    const amountCol = headers.find(h => mapping[h] === 'amount');
    const categoryCol = headers.find(h => mapping[h] === 'category');
    const typeCol = headers.find(h => mapping[h] === 'type');

    return rows.map((row, index) => {
        const result = { index, valid: true, error: '' };

        // Description
        result.description = descCol ? (row[descCol] || '').trim() : '';
        if (!result.description) {
            result.valid = false;
            result.error = 'Sem descrição';
        }

        // Amount
        if (amountCol) {
            result.amount = parseAmount(row[amountCol]);
        } else {
            result.amount = 0;
        }
        if (!result.amount || result.amount <= 0) {
            result.valid = false;
            result.error = result.error || 'Valor inválido';
        }

        // Date
        if (dateCol) {
            result.date = parseDate(row[dateCol]);
            result.dateDisplay = result.date ? formatDateBr(result.date) : 'Data inválida';
        } else {
            result.date = null;
            result.dateDisplay = '—';
        }
        if (!result.date) {
            result.valid = false;
            result.error = result.error || 'Data inválida';
        }

        // Type
        if (typeCol) {
            const rawType = (row[typeCol] || '').toLowerCase().trim();
            if (['receita', 'income', 'credito', 'crédito'].includes(rawType)) {
                result.type = 'income';
            } else if (['conta', 'bill', 'boleto'].includes(rawType)) {
                result.type = 'bill';
            } else {
                result.type = 'expense';
            }
        } else {
            result.type = 'expense';
        }

        // Category (try to match existing)
        result.category_id = null;
        result.category_name = '';
        if (categoryCol && row[categoryCol]) {
            const rawCat = row[categoryCol].trim().toLowerCase();
            const match = categories.find(c => c.name.toLowerCase() === rawCat);
            if (match) {
                result.category_id = match.id;
                result.category_name = match.name;
            } else {
                result.category_name = row[categoryCol].trim();
            }
        }

        return result;
    });
}

/**
 * Parse amount string from CSV (handles Brazilian and international formats)
 */
export function parseAmount(str) {
    if (!str) return 0;
    let clean = str.toString().replace(/[R$\s]/g, '').trim();
    // Handle negatives
    const isNegative = clean.startsWith('-') || clean.startsWith('(');
    clean = clean.replace(/[-()]/g, '');

    if (clean.includes(',') && clean.includes('.')) {
        // 1.234,56 -> 1234.56 (BR) or 1,234.56 (US)
        const lastComma = clean.lastIndexOf(',');
        const lastDot = clean.lastIndexOf('.');
        if (lastComma > lastDot) {
            // BR format: 1.234,56
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            // US format: 1,234.56
            clean = clean.replace(/,/g, '');
        }
    } else if (clean.includes(',')) {
        // Could be 1234,56 (BR decimal) or 1,234 (US thousands)
        const parts = clean.split(',');
        if (parts[1] && parts[1].length <= 2) {
            // BR decimal
            clean = clean.replace(',', '.');
        } else {
            // US thousands
            clean = clean.replace(/,/g, '');
        }
    }

    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.abs(num);
}

/**
 * Parse date string from CSV (handles DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY)
 */
export function parseDate(str) {
    if (!str) return null;
    const s = str.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.substring(0, 10);
    }

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const match = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) {
            year = (parseInt(year) > 50 ? '19' : '20') + year;
        }
        if (parseInt(month) >= 1 && parseInt(month) <= 12 && parseInt(day) >= 1 && parseInt(day) <= 31) {
            return `${year}-${month}-${day}`;
        }
    }

    return null;
}

function formatDateBr(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
}
