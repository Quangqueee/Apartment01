/**
 * Module kiểm tra và xác thực mật khẩu
 * Bao gồm các rule kiểm tra độ mạnh mật khẩu và thông báo lỗi tiếng Việt
 */

export interface KetQuaKiemTraMatKhau {
    hopLe: boolean;
    cacLoiNhap: string[];
    doDamBao: 'yeu' | 'trung_binh' | 'manh' | 'rat_manh';
}

/**
 * Kiểm tra độ mạnh mật khẩu theo các tiêu chí:
 * - Độ dài: 8-24 ký tự
 * - Ít nhất 1 chữ thường (a-z)
 * - Ít nhất 1 chữ hoa (A-Z)
 * - Ít nhất 1 chữ số (0-9)
 */
export function kiemTraMatKhau(matKhau: string): KetQuaKiemTraMatKhau {
    const cacLoiNhap: string[] = [];

    // Kiểm tra độ dài
    if (matKhau.length < 8) {
        cacLoiNhap.push('Mật khẩu phải có ít nhất 8 ký tự');
    } else if (matKhau.length > 24) {
        cacLoiNhap.push('Mật khẩu không được vượt quá 24 ký tự');
    }

    // Kiểm tra chữ thường
    if (!/[a-z]/.test(matKhau)) {
        cacLoiNhap.push('Mật khẩu phải có ít nhất 1 chữ cái thường (a-z)');
    }

    // Kiểm tra chữ hoa
    if (!/[A-Z]/.test(matKhau)) {
        cacLoiNhap.push('Mật khẩu phải có ít nhất 1 chữ cái hoa (A-Z)');
    }

    // Kiểm tra chữ số
    if (!/[0-9]/.test(matKhau)) {
        cacLoiNhap.push('Mật khẩu phải có ít nhất 1 chữ số (0-9)');
    }

    // Tính độ đảm bảo
    let doDamBao: 'yeu' | 'trung_binh' | 'manh' | 'rat_manh' = 'yeu';
    if (cacLoiNhap.length === 0) {
        if (matKhau.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(matKhau)) {
            doDamBao = 'rat_manh';
        } else if (matKhau.length >= 12) {
            doDamBao = 'manh';
        } else {
            doDamBao = 'trung_binh';
        }
    }

    return {
        hopLe: cacLoiNhap.length === 0,
        cacLoiNhap,
        doDamBao,
    };
}

/**
 * Kiểm tra xác nhận mật khẩu có khớp không
 */
export function kiemTraXacNhanMatKhau(
    matKhau: string,
    xacNhanMatKhau: string
): {
    hopLe: boolean;
    loiNhap?: string;
} {
    if (matKhau !== xacNhanMatKhau) {
        return {
            hopLe: false,
            loiNhap: 'Mật khẩu nhắc lại không khớp',
        };
    }

    return {
        hopLe: true,
    };
}

/**
 * Kiểm tra số điện thoại hợp lệ (định dạng Việt Nam)
 */
export function kiemTraSoDienThoai(soDienThoai: string): {
    hopLe: boolean;
    loiNhap?: string;
} {
    const soDienThoaiTrim = soDienThoai.trim();

    // Loại bỏ các khoảng trắng
    const soDienThoaiSach = soDienThoaiTrim.replace(/\s/g, '');

    // Kiểm tra định dạng (có thể là +84, 0, hoặc không có)
    const regex = /^(\+84|0)?[3|5|7|8|9][0-9]{8}$/;

    if (!regex.test(soDienThoaiSach)) {
        return {
            hopLe: false,
            loiNhap: 'Số điện thoại không hợp lệ (ví dụ: 0901234567 hoặc +84901234567)',
        };
    }

    return {
        hopLe: true,
    };
}

/**
 * Lấy thông báo về độ đảm bảo mật khẩu
 */
export function layThongBaoDoDamBao(
    doDamBao: 'yeu' | 'trung_binh' | 'manh' | 'rat_manh'
): string {
    const cacThongBao = {
        yeu: 'Mật khẩu yếu',
        trung_binh: 'Mật khẩu trung bình',
        manh: 'Mật khẩu mạnh',
        rat_manh: 'Mật khẩu rất mạnh',
    };

    return cacThongBao[doDamBao];
}

/**
 * Lấy màu sắc cho độ đảm bảo mật khẩu (Tailwind classes)
 */
export function layMauSacDoDamBao(
    doDamBao: 'yeu' | 'trung_binh' | 'manh' | 'rat_manh'
): string {
    const cacMau = {
        yeu: 'text-red-500',
        trung_binh: 'text-yellow-500',
        manh: 'text-blue-500',
        rat_manh: 'text-green-500',
    };

    return cacMau[doDamBao];
}
