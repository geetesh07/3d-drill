export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function checkPasswordStrength(password: string): PasswordStrength {
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength++;
  
  // Contains number
  if (/\d/.test(password)) strength++;
  
  // Contains lowercase letter
  if (/[a-z]/.test(password)) strength++;
  
  // Contains uppercase letter
  if (/[A-Z]/.test(password)) strength++;
  
  // Contains special character
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return 'weak';
  if (strength <= 3) return 'medium';
  return 'strong';
}

export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
  }
}

export function getPasswordStrengthText(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak password';
    case 'medium':
      return 'Medium strength';
    case 'strong':
      return 'Strong password';
  }
} 