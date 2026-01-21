import { Injectable, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { AuthAuditoria } from '../entities/auth-auditoria.entity';
import { AuthRefreshToken } from '../entities/auth-token.entity';
import { Dispositivo } from '../entities/dispositivo.entity';
import { Role } from '../entities/role.entity';
import { Usuario } from '../entities/usuario.entity';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';

/**
 * HALLAZGO #8: Hash dummy para prevenir timing attacks
 * Se usa cuando el usuario no existe para mantener tiempos de respuesta constantes
 */
const DUMMY_PASSWORD_HASH = '$2b$10$dummyHashForTimingAttackPrevention1234567890abcdef';

/**
 * Máximo de refresh tokens activos por usuario
 * Al crear uno nuevo sobre este límite, se revoca el más antiguo
 */
const MAX_ACTIVE_REFRESH_TOKENS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(AuthRefreshToken) private tokenRepo: Repository<AuthRefreshToken>,
    @InjectRepository(Dispositivo) private dispositivoRepo: Repository<Dispositivo>,
    @InjectRepository(AuthAuditoria) private auditoriaRepo: Repository<AuthAuditoria>,
    private readonly jwtService: JwtService,
  ) { }

  // --- HELPER PRIVADO PARA EVITAR CÓDIGO DUPLICADO ---
  private parseDuration(v: string): number {
    const s = v.toString().trim().toLowerCase();
    if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
    const n = parseInt(s.slice(0, -1), 10);
    if (s.endsWith('m')) return n * 60;
    if (s.endsWith('h')) return n * 3600;
    if (s.endsWith('d')) return n * 86400;
    return parseInt(s, 10) || 600;
  }

  /**
   * Obtiene el secreto para refresh tokens (separado del access token)
   * SEGURIDAD: Usar secretos diferentes previene que un access token comprometido
   * pueda ser usado para generar refresh tokens y viceversa
   */
  private get refreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET no está configurado');
    }
    return secret;
  }

  /**
   * Firma un refresh token usando JWT_REFRESH_SECRET
   */
  private signRefreshToken(payload: object, expiresIn: number): string {
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn,
    });
  }

  /**
   * Verifica y decodifica un refresh token usando JWT_REFRESH_SECRET
   * @throws UnauthorizedException si el token es inválido o expirado
   */
  private verifyRefreshToken(token: string): any {
    try {
      return this.jwtService.verify(token, { secret: this.refreshSecret });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expirado');
      }
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  /**
   * Decodifica un refresh token sin verificar la firma (para obtener el payload)
   * Útil para extraer el usuario antes de buscar en BD
   */
  private decodeRefreshToken(token: string): any {
    return this.jwtService.decode(token);
  }

  async registro(dto: CreateUsuarioDto) {
    const existe = await this.usuarioRepo.findOne({ where: { email: dto.email } });
    if (existe) throw new ConflictException('Email ya registrado');

    const rol = await this.roleRepo.findOne({ where: { id: dto.rolId } });
    if (!rol) throw new BadRequestException('Rol no válido');

    const hash = await bcrypt.hash(dto.password, 10);

    const nuevoUsuario = this.usuarioRepo.create({
      email: dto.email,
      passwordHash: hash,
      nombre: dto.nombre,
      rol: rol,
    });

    await this.usuarioRepo.save(nuevoUsuario);
    return { mensaje: 'Usuario registrado', id: nuevoUsuario.id };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string, deviceId?: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { email: dto.email },
      relations: ['rol'],
    });

    /**
     * HALLAZGO #8: Prevención de enumeración de usuarios
     * - Siempre ejecutamos bcrypt.compare() para mantener timing constante
     * - El mensaje de error es genérico sin revelar si el usuario existe
     * - Logs internos SÍ diferencian para análisis de seguridad
     */
    const hashToCompare = usuario?.passwordHash || DUMMY_PASSWORD_HASH;
    const passwordValid = await bcrypt.compare(dto.password, hashToCompare);

    // Determinar razón del fallo para logs internos (NO exponer al cliente)
    let failureReason: string | null = null;
    if (!usuario) {
      failureReason = 'USER_NOT_FOUND';
    } else if (!passwordValid) {
      failureReason = 'INVALID_PASSWORD';
    }

    if (failureReason) {
      // Log interno con detalle (para análisis de seguridad)
      this.logger.warn(`Login fallido - Razón: ${failureReason}, Email: ${dto.email}, IP: ${ip}`);

      await this.auditoriaRepo.save({
        evento: 'LOGIN_FAILED',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { email: dto.email, reason: failureReason },
      });

      // Mensaje genérico al cliente - NO revela si el usuario existe
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Generar Access Token
    const accessPayload = { sub: usuario.id, email: usuario.email, role: usuario.rol?.nombre };
    const accessTtl = process.env.ACCESS_TOKEN_TTL || '12h';
    const accessSeconds = this.parseDuration(accessTtl);
    const access_token = this.jwtService.sign(accessPayload, { expiresIn: accessSeconds });

    // Generar Refresh Token (usa JWT_REFRESH_SECRET separado)
    const refreshPayload = { sub: usuario.id, type: 'refresh' };
    const refreshTtl = process.env.REFRESH_TOKEN_TTL || '7d';
    const refreshSeconds = this.parseDuration(refreshTtl);
    const refresh_token = this.signRefreshToken(refreshPayload, refreshSeconds);

    // Single Session Logic
    if (process.env.SINGLE_SESSION === 'true') {
      await this.tokenRepo
        .createQueryBuilder()
        .update()
        .set({ revocado: true })
        .where('usuario_id = :uid AND revocado = false', { uid: usuario.id })
        .execute();
    }

    // Guardar Refresh Token en BD
    const tokenHash = await bcrypt.hash(refresh_token, 10);
    const ahora = new Date();
    const fechaExpiracion = new Date(ahora.getTime() + refreshSeconds * 1000);

    const tokenEntity = new AuthRefreshToken();
    tokenEntity.usuario = usuario;
    if (deviceId) {
      const disp = await this.dispositivoRepo.findOne({ where: { device_id: deviceId, usuario: { id: usuario.id } } });
      if (disp) tokenEntity.dispositivo = disp;
    }
    tokenEntity.token_hash = tokenHash;
    tokenEntity.fechaExpiracion = fechaExpiracion;
    tokenEntity.ipCreacion = ip;
    tokenEntity.userAgent = userAgent;

    await this.tokenRepo.save(tokenEntity);

    // HALLAZGO #4: Limitar tokens activos por usuario
    await this.enforceMaxActiveTokens(usuario.id);

    await this.auditoriaRepo.save({
      usuario_id: usuario.id,
      evento: 'LOGIN',
      ip_address: ip,
      user_agent: userAgent,
    });

    usuario.lastLogin = new Date();
    await this.usuarioRepo.save(usuario);

    return { access_token, refresh_token, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, role: usuario.rol?.nombre } };
  }

  /**
   * HALLAZGO #5: Logout que efectivamente invalida tokens
   * @param usuarioId - ID del usuario
   * @param refreshToken - Token a revocar (opcional, si no se provee y logoutAll=false, no revoca nada específico)
   * @param ip - IP del cliente
   * @param userAgent - User agent del cliente
   * @param logoutAll - Si es true, revoca TODOS los refresh tokens del usuario
   */
  async logout(usuarioId: string, refreshToken?: string, ip?: string, userAgent?: string, logoutAll = false) {
    let tokensRevoked = 0;

    if (logoutAll) {
      // Revocar TODOS los tokens del usuario (logout de todos los dispositivos)
      const result = await this.tokenRepo
        .createQueryBuilder()
        .update()
        .set({ revocado: true, revocadoRazon: 'logout_all' })
        .where('usuario_id = :uid AND revocado = false', { uid: usuarioId })
        .execute();

      tokensRevoked = result.affected || 0;
      this.logger.log(`Logout ALL - Usuario: ${usuarioId}, Tokens revocados: ${tokensRevoked}`);
    } else if (refreshToken) {
      // Revocar solo el refresh token específico
      const activos = await this.tokenRepo.find({ where: { usuario: { id: usuarioId }, revocado: false } });
      for (const t of activos) {
        const match = await bcrypt.compare(refreshToken, t.token_hash);
        if (match) {
          t.revocado = true;
          t.revocadoRazon = 'logout';
          await this.tokenRepo.save(t);
          tokensRevoked = 1;
          this.logger.log(`Logout - Usuario: ${usuarioId}, Token específico revocado`);
          break;
        }
      }
    }

    await this.auditoriaRepo.save({
      usuario_id: usuarioId,
      evento: logoutAll ? 'LOGOUT_ALL' : 'LOGOUT',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { tokens_revoked: tokensRevoked },
    });

    return {
      mensaje: logoutAll ? 'Logout de todos los dispositivos exitoso' : 'Logout exitoso',
      tokensRevoked,
    };
  }

  async registrarDispositivo(usuarioId: string, device_id: string, _ip?: string) {
    const dispositivo = await this.dispositivoRepo.findOne({
      where: { usuario: { id: usuarioId }, device_id },
    });

    if (dispositivo) {
      dispositivo.ultimoAcceso = new Date();
      const saved = await this.dispositivoRepo.save(dispositivo);
      await this.auditoriaRepo.save({
        usuario_id: usuarioId,
        evento: 'DISPOSITIVO_ACTUALIZADO',
        ip_address: _ip,
        dispositivo_id: saved.id,
      } as Partial<AuthAuditoria>);
      return saved;
    }

    const nuevo = this.dispositivoRepo.create({
      usuario: { id: usuarioId },
      device_id,
      ultimoAcceso: new Date(),
    } as Partial<Dispositivo>); // Cast necesario si la entidad es estricta
    const saved = await this.dispositivoRepo.save(nuevo);
    await this.auditoriaRepo.save({
      usuario_id: usuarioId,
      evento: 'DISPOSITIVO_REGISTRADO',
      ip_address: _ip,
      dispositivo_id: saved.id,
    } as Partial<AuthAuditoria>);
    return saved;
  }

  async refreshTokens(providedRefreshToken: string, deviceId?: string, ip?: string, userAgent?: string) {
    // Primero verificamos la firma del token con JWT_REFRESH_SECRET
    // Esto asegura que el token fue firmado por nosotros y no ha sido manipulado
    let decoded: any;
    try {
      decoded = this.verifyRefreshToken(providedRefreshToken);
    } catch (error) {
      // Si falla la verificación, el token es inválido o expirado
      throw error;
    }

    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Token ilegible');
    }
    const usuarioId = decoded.sub;

    // Buscamos solo los tokens de este usuario (incluidos revocados para detectar reuso)
    const candidatos = await this.tokenRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario'],
    });

    let matched: AuthRefreshToken | null = null;

    for (const c of candidatos) {
      const ok = await bcrypt.compare(providedRefreshToken, c.token_hash);
      if (!ok) continue;

      /**
       * HALLAZGO #4: Detección de reutilización de refresh tokens
       * Si el token ya fue revocado (rotado), significa que alguien está intentando reutilizarlo
       * Esto puede indicar robo del token original
       */
      if (c.revocado || c.replacedByToken) {
        this.logger.error(
          `🚨 TOKEN REUSE DETECTED - Usuario: ${usuarioId}, Token ya usado/rotado, IP: ${ip}`,
        );

        // Usar el método centralizado para manejar reutilización
        await this.handleTokenReuse(usuarioId, ip);

        throw new UnauthorizedException('Sesión inválida. Por seguridad, todas las sesiones han sido cerradas.');
      }

      // Verificar expiración de BD
      if (c.fechaExpiracion && c.fechaExpiracion.getTime() < Date.now()) {
        throw new UnauthorizedException('Refresh token expirado');
      }

      matched = c;
      break;
    }

    if (!matched) throw new UnauthorizedException('Refresh token inválido');

    // Rotación de token - marcar el actual como reemplazado
    matched.revocado = true;
    matched.revocadoRazon = 'rotated';
    await this.tokenRepo.save(matched);

    const usuario = await this.usuarioRepo.findOne({ where: { id: matched.usuario.id }, relations: ['rol'] });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    // Generar nuevos tokens
    const accessTtl = process.env.ACCESS_TOKEN_TTL || '12h';
    const accessSeconds = this.parseDuration(accessTtl);
    const accessPayload = { sub: usuario.id, email: usuario.email, role: usuario.rol?.nombre };
    const access_token = this.jwtService.sign(accessPayload, { expiresIn: accessSeconds });

    // Generar nuevo Refresh Token (usa JWT_REFRESH_SECRET separado)
    const refreshTtl = process.env.REFRESH_TOKEN_TTL || '7d';
    const refreshSeconds = this.parseDuration(refreshTtl);
    const refresh_token = this.signRefreshToken({ sub: usuario.id, type: 'refresh' }, refreshSeconds);

    // Guardar nuevo refresh token
    const tokenHash = await bcrypt.hash(refresh_token, 10);
    const nuevo = new AuthRefreshToken();
    nuevo.usuario = usuario;
    if (deviceId) {
      const disp = await this.dispositivoRepo.findOne({ where: { device_id: deviceId, usuario: { id: usuario.id } } });
      if (disp) nuevo.dispositivo = disp;
    }
    nuevo.token_hash = tokenHash;
    nuevo.fechaExpiracion = new Date(Date.now() + refreshSeconds * 1000);
    nuevo.ipCreacion = ip;
    nuevo.userAgent = userAgent;
    nuevo.replacedByToken = matched.id;

    await this.tokenRepo.save(nuevo);

    await this.auditoriaRepo.save({
      usuario_id: usuario.id,
      evento: 'REFRESH',
      ip_address: ip, // Corregido: ip -> ip_address para consistencia si tu entidad usa snake_case
      user_agent: userAgent,
      metadata: { descripcion: 'Refresh token rotado' },
    });

    return { access_token, refresh_token };
  }

  /**
   * HALLAZGO #4: Limita la cantidad de refresh tokens activos por usuario
   * Revoca los más antiguos si se excede el límite
   */
  private async enforceMaxActiveTokens(usuarioId: string): Promise<void> {
    const activeTokens = await this.tokenRepo.find({
      where: { usuario: { id: usuarioId }, revocado: false },
      order: { createdAt: 'ASC' }, // Los más antiguos primero
    });

    if (activeTokens.length > MAX_ACTIVE_REFRESH_TOKENS) {
      const tokensToRevoke = activeTokens.slice(0, activeTokens.length - MAX_ACTIVE_REFRESH_TOKENS);

      for (const token of tokensToRevoke) {
        token.revocado = true;
        token.revocadoRazon = 'max_tokens_exceeded';
        await this.tokenRepo.save(token);
      }

      this.logger.log(
        `Tokens antiguos revocados - Usuario: ${usuarioId}, Cantidad: ${tokensToRevoke.length}`,
      );
    }
  }

  /**
   * HALLAZGO #4: Maneja la detección de reutilización de tokens
   * Revoca TODOS los tokens del usuario como medida de seguridad
   */
  private async handleTokenReuse(usuarioId: string, ip?: string): Promise<void> {
    // Revocar TODOS los tokens del usuario
    await this.tokenRepo
      .createQueryBuilder()
      .update()
      .set({ revocado: true, revocadoRazon: 'reuse_detected_revoke_all' })
      .where('usuario_id = :uid', { uid: usuarioId })
      .execute();

    // Loguear evento crítico de seguridad
    await this.auditoriaRepo.save({
      usuario_id: usuarioId,
      evento: 'TOKEN_REUSE_DETECTED',
      ip_address: ip,
      metadata: {
        severity: 'CRITICAL',
        descripcion: 'Posible robo de refresh token detectado - todas las sesiones revocadas',
      },
    });

    this.logger.error(
      `🚨 SEGURIDAD: Reutilización de token detectada - Usuario: ${usuarioId}, IP: ${ip}. Todas las sesiones revocadas.`,
    );
  }

  // Batch interno para otros servicios: retorna campos básicos de usuarios
  async obtenerUsuariosPorIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];

    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'r')
      .where('u.id IN (:...ids)', { ids })
      .select([
        'u.id',
        'u.email',
        'u.nombre',
        'u.telefono',
        'r.id',
        'r.nombre',
      ])
      .getMany();

    // Devuelve estructura simple; ajustar si necesitas más campos
    return usuarios.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      telefono: u.telefono,
      rol: u.rol ? { id: u.rol.id, nombre: u.rol.nombre } : null,
    }));
  }
}