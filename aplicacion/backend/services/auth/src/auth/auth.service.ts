import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(AuthRefreshToken) private tokenRepo: Repository<AuthRefreshToken>,
    @InjectRepository(Dispositivo) private dispositivoRepo: Repository<Dispositivo>,
    @InjectRepository(AuthAuditoria) private auditoriaRepo: Repository<AuthAuditoria>,
    private readonly jwtService: JwtService,
  ) {}

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

    if (!usuario || !(await bcrypt.compare(dto.password, usuario.passwordHash))) {
      await this.auditoriaRepo.save({
        evento: 'FAIL',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { email: dto.email },
      });
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

    // Generar Refresh Token
    const refreshPayload = { sub: usuario.id, type: 'refresh' };
    const refreshTtl = process.env.REFRESH_TOKEN_TTL || '7d';
    const refreshSeconds = this.parseDuration(refreshTtl);
    const refresh_token = this.jwtService.sign(refreshPayload, { expiresIn: refreshSeconds });

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

  async logout(usuarioId: string, refreshToken?: string, ip?: string, userAgent?: string) {
    if (refreshToken) {
      const activos = await this.tokenRepo.find({ where: { usuario: { id: usuarioId }, revocado: false } });
      for (const t of activos) {
        const match = await bcrypt.compare(refreshToken, t.token_hash);
        if (match) {
          t.revocado = true;
          t.revocadoRazon = 'logout';
          await this.tokenRepo.save(t);
          break;
        }
      }
    } else {
      await this.tokenRepo
        .createQueryBuilder()
        .update()
        .set({ revocado: true, revocadoRazon: 'logout_all' })
        .where('usuario_id = :uid AND revocado = false', { uid: usuarioId })
        .execute();
    }

    await this.auditoriaRepo.save({
      usuario_id: usuarioId,
      evento: 'LOGOUT',
      ip_address: ip,
      user_agent: userAgent,
    });

    return { mensaje: 'Logout exitoso' };
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
    // OPTIMIZACIÓN: Decodificamos el token para sacar el ID del usuario y NO buscar en toda la tabla
    const decoded = this.jwtService.decode(providedRefreshToken) as any;
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Token ilegible');
    }
    const usuarioId = decoded.sub;

    // Buscamos solo los tokens de este usuario
    const candidatos = await this.tokenRepo.find({
      where: { usuario: { id: usuarioId } }
    });

    let matched: AuthRefreshToken | null = null;
    
    for (const c of candidatos) {
      // Verificar expiración de BD
      if (c.fechaExpiracion && c.fechaExpiracion.getTime() < Date.now()) continue;
      
      const ok = await bcrypt.compare(providedRefreshToken, c.token_hash);
      if (!ok) continue;

      // Detección de reuso
      if (c.revocado) {
        await this.tokenRepo
          .createQueryBuilder()
          .update()
          .set({ revocado: true, revocadoRazon: 'reuse_detected' })
          .where('usuario_id = :uid', { uid: c.usuario.id })
          .execute();

        await this.auditoriaRepo.save({
          usuario_id: c.usuario.id,
          evento: 'REUSE_DETECTED',
          metadata: { descripcion: 'Refresh token reuse detected - all tokens revoked' },
        });

        throw new UnauthorizedException('Refresh token reuse detected');
      }

      matched = c;
      break;
    }

    if (!matched) throw new UnauthorizedException('Refresh token inválido o revocado');

    // Rotación de token
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

    const refreshTtl = process.env.REFRESH_TOKEN_TTL || '7d';
    const refreshSeconds = this.parseDuration(refreshTtl);
    const refresh_token = this.jwtService.sign({ sub: usuario.id, type: 'refresh' }, { expiresIn: refreshSeconds });

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