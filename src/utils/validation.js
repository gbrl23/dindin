/**
 * Validação de Inputs - Expense Tracker
 * Funções reutilizáveis para validação de formulários
 */

/**
 * Valida se um valor numérico é positivo
 * @param {string|number} value - Valor a validar
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAmount(value) {
    if (!value && value !== 0) {
        return { valid: false, message: 'Valor é obrigatório' };
    }

    const numericValue = typeof value === 'string'
        ? parseFloat(value.replace(',', '.'))
        : value;

    if (isNaN(numericValue)) {
        return { valid: false, message: 'Valor inválido' };
    }

    if (numericValue <= 0) {
        return { valid: false, message: 'Valor deve ser maior que zero' };
    }

    return { valid: true };
}

/**
 * Valida um valor numérico não negativo (pode ser zero)
 * @param {string|number} value - Valor a validar
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateNonNegativeAmount(value) {
    if (!value && value !== 0) {
        return { valid: false, message: 'Valor é obrigatório' };
    }

    const numericValue = typeof value === 'string'
        ? parseFloat(value.replace(',', '.'))
        : value;

    if (isNaN(numericValue)) {
        return { valid: false, message: 'Valor inválido' };
    }

    if (numericValue < 0) {
        return { valid: false, message: 'Valor não pode ser negativo' };
    }

    return { valid: true };
}

/**
 * Valida uma descrição/texto (alias para nome)
 * @param {string} value - Texto a validar
 * @param {object} options - Opções de validação
 * @param {boolean} options.required - Se é obrigatório (default: true)
 * @param {number} options.maxLength - Tamanho máximo (default: 100)
 * @param {number} options.minLength - Tamanho mínimo (default: 1)
 * @param {string} options.fieldName - Nome do campo para mensagem (default: 'Campo')
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateDescription(value, options = {}) {
    const { required = true, maxLength = 100, minLength = 1, fieldName = 'Campo' } = options;

    const trimmedValue = (value || '').trim();

    if (required && trimmedValue.length < minLength) {
        return { valid: false, message: `${fieldName} é obrigatório` };
    }

    if (trimmedValue.length > maxLength) {
        return { valid: false, message: `Máximo ${maxLength} caracteres` };
    }

    return { valid: true };
}

/**
 * Alias para validateDescription para campos de nome
 */
export function validateName(value, options = {}) {
    return validateDescription(value, { ...options, fieldName: options.fieldName || 'Nome' });
}

/**
 * Valida um dia do mês (1-31)
 * @param {string|number} value - Dia a validar
 * @param {object} options - Opções de validação
 * @param {boolean} options.required - Se é obrigatório (default: true)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateDayOfMonth(value, options = {}) {
    const { required = true } = options;

    if (!value && value !== 0) {
        if (required) {
            return { valid: false, message: 'Dia é obrigatório' };
        }
        return { valid: true };
    }

    const day = parseInt(value, 10);

    if (isNaN(day)) {
        return { valid: false, message: 'Dia inválido' };
    }

    if (day < 1 || day > 31) {
        return { valid: false, message: 'Dia deve ser entre 1 e 31' };
    }

    return { valid: true };
}

/**
 * Valida uma data
 * @param {string} value - Data em formato ISO (YYYY-MM-DD)
 * @param {object} options - Opções de validação
 * @param {boolean} options.required - Se é obrigatório (default: true)
 * @param {number} options.minYear - Ano mínimo (default: 2000)
 * @param {number} options.maxYear - Ano máximo (default: 2099)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateDate(value, options = {}) {
    const { required = true, minYear = 2000, maxYear = 2099 } = options;

    if (!value) {
        if (required) {
            return { valid: false, message: 'Data é obrigatória' };
        }
        return { valid: true };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return { valid: false, message: 'Data inválida' };
    }

    const year = date.getFullYear();
    if (year < minYear || year > maxYear) {
        return { valid: false, message: `Ano deve estar entre ${minYear} e ${maxYear}` };
    }

    return { valid: true };
}

/**
 * Valida múltiplos campos de uma vez
 * @param {object} validations - Objeto com { campo: resultado_validacao }
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateAll(validations) {
    const errors = {};
    let valid = true;

    for (const [field, result] of Object.entries(validations)) {
        if (!result.valid) {
            valid = false;
            errors[field] = result.message;
        }
    }

    return { valid, errors };
}

/**
 * Estilo para campo com erro
 */
export const errorInputStyle = {
    borderColor: '#FF3B30',
    boxShadow: '0 0 0 2px rgba(255, 59, 48, 0.2)'
};

/**
 * Estilo para container de input com erro
 */
export const errorContainerStyle = {
    border: '1px solid #FF3B30',
    boxShadow: '0 0 0 2px rgba(255, 59, 48, 0.2)'
};

/**
 * Componente de mensagem de erro inline
 */
export const getErrorMessageStyle = () => ({
    color: '#FF3B30',
    fontSize: '0.75rem',
    marginTop: '4px',
    marginLeft: '4px',
    fontWeight: '500'
});

