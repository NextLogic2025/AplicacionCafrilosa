import { IsEmail, IsString, IsOptional, IsNumber, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * HALLAZGO #7: Expresión regular para validación de contraseñas fuertes
 * Requiere:
 * - Mínimo 8 caracteres
 * - Al menos 1 letra mayúscula
 * - Al menos 1 letra minúscula
 * - Al menos 1 número
 * - Al menos 1 carácter especial (@$!%*?&)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

const PASSWORD_ERROR_MESSAGE =
  'La contraseña debe tener mínimo 8 caracteres, incluir al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&._-)';

export class CreateUsuarioDto {
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  /**
   * HALLAZGO #7: Validación de complejidad de contraseña
   * - Mínimo 8 caracteres
   * - Máximo 128 caracteres (límite razonable para bcrypt)
   * - Debe cumplir con el patrón de seguridad
   */
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_ERROR_MESSAGE })
  password: string;

  @IsString({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsNumber()
  rolId?: number;
}
