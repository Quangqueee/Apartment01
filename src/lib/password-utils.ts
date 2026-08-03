/**
 * Password validation and authentication module
 * Includes password strength rules and Vietnamese error messages.
 */

export interface PasswordCheckResult {
    isValid: boolean;
    errors: string[];
    strengthLevel: 'weak' | 'medium' | 'strong' | 'very_strong';
}

/**
 * Check password strength based on:
 * - Length: 8-24 characters
 * - At least 1 lowercase letter (a-z)
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 number (0-9)
 */
export function checkPasswordStrength(password: string): PasswordCheckResult {
    const errors: string[] = [];

    // Check length
    if (password.length < 8) {
        errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    } else if (password.length > 24) {
        errors.push('Mật khẩu không được vượt quá 24 ký tự');
    }

    // Check lowercase
    if (!/[a-z]/.test(password)) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ cái thường (a-z)');
    }

    // Check uppercase
    if (!/[A-Z]/.test(password)) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ cái hoa (A-Z)');
    }

    // Check numbers
    if (!/[0-9]/.test(password)) {
        errors.push('Mật khẩu phải có ít nhất 1 chữ số (0-9)');
    }

    // Calculate strength
    let strengthLevel: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';

    if (errors.length === 0) {
        if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            strengthLevel = 'very_strong';
        } else if (password.length >= 12) {
            strengthLevel = 'strong';
        } else {
            strengthLevel = 'medium';
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        strengthLevel,
    };
}

/**
 * Check if password confirmation matches
 */
export function checkPasswordMatch(
    password: string,
    confirmPassword: string
): {
    isValid: boolean;
    errorMessage?: string;
} {
    if (password !== confirmPassword) {
        return {
            isValid: false,
            errorMessage: 'Mật khẩu nhắc lại không khớp',
        };
    }

    return {
        isValid: true,
    };
}

/**
 * Check valid phone number (Vietnam format)
 * Note: If using react-phone-number-input, this might be redundant but kept for utility.
 */
export function checkPhoneNumber(phoneNumber: string): {
    isValid: boolean;
    errorMessage?: string;
} {
    const trimmedPhone = phoneNumber.trim();

    // Remove spaces
    const cleanPhone = trimmedPhone.replace(/\s/g, '');

    // Check format (+84, 0, or none)
    const regex = /^(\+84|0)?[3|5|7|8|9][0-9]{8}$/;

    if (!regex.test(cleanPhone)) {
        return {
            isValid: false,
            errorMessage: 'Số điện thoại không hợp lệ (ví dụ: 0901234567 hoặc +84901234567)',
        };
    }

    return {
        isValid: true,
    };
}

/**
 * Get password strength message
 */
export function getPasswordStrengthMessage(
    strengthLevel: 'weak' | 'medium' | 'strong' | 'very_strong'
): string {
    const messages = {
        weak: 'Mật khẩu yếu',
        medium: 'Mật khẩu trung bình',
        strong: 'Mật khẩu mạnh',
        very_strong: 'Mật khẩu rất mạnh',
    };

    return messages[strengthLevel];
}

/**
 * Get Tailwind color class for password strength
 */
export function getPasswordStrengthColor(
    strengthLevel: 'weak' | 'medium' | 'strong' | 'very_strong'
): string {
    const colors = {
        weak: 'text-red-500',
        medium: 'text-yellow-500',
        strong: 'text-blue-500',
        very_strong: 'text-green-500',
    };

    return colors[strengthLevel];
}