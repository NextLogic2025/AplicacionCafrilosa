import { Injectable, ConflictException, BadRequestException, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    // Auditoría de intento fallido
    if (!usuario || !(await bcrypt.compare(dto.password, usuario.passwordHash))) {
      await this.auditoriaRepo.save({
        evento: 'FAIL',
        ip_address: ip,
        user_agent: userAgent,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Deny login if the user is deactivated
    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Access token short-lived (recommended 5-10m)
    const accessPayload = { sub: usuario.id, email: usuario.email, role: usuario.rol?.nombre };
    const accessTtl = process.env.ACCESS_TOKEN_TTL || '12h';
    const parseDuration = (v: string) => {
      const s = v.toString().trim().toLowerCase();
      if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
      const n = parseInt(s.slice(0, -1), 10);
      if (s.endsWith('m')) return n * 60;
      if (s.endsWith('h')) return n * 3600;
      if (s.endsWith('d')) return n * 86400;
      return parseInt(s, 10) || 600;
    };
    const accessSeconds = parseDuration(accessTtl);
    const access_token = this.jwtService.sign(accessPayload, { expiresIn: accessSeconds });

    // Refresh token long-lived
    const refreshPayload = { sub: usuario.id, type: 'refresh' };
    const refreshTtl = process.env.REFRESH_TOKEN_TTL || '7d';
    const refreshSeconds = parseDuration(refreshTtl);
    const refresh_token = this.jwtService.sign(refreshPayload, { expiresIn: refreshSeconds });

    // Optionally enforce single session: revoke previous refresh tokens
    if (process.env.SINGLE_SESSION === 'true') {
      await this.tokenRepo
        .createQueryBuilder()
        .update()
        .set({ revocado: true })
        .where('usuario_id = :uid AND revocado = false', { uid: usuario.id })
        .execute();
    }

    // Save refresh token hash in DB
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

    // Registrar login en auditoría
    await this.auditoriaRepo.save({
      usuario_id: usuario.id,
      evento: 'LOGIN',
      ip_address: ip,
      user_agent: userAgent,
    });

    // Actualizar last_login
    usuario.lastLogin = new Date();
    await this.usuarioRepo.save(usuario);

    return { access_token, refresh_token, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, role: usuario.rol?.nombre } };
  }

  async logout(usuarioId: string, refreshToken?: string, ip?: string, userAgent?: string) {
    // If a refresh token string is provided, revoke only that token; otherwise revoke all refresh tokens for user
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

    // Registrar logout en auditoría
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
      return this.dispositivoRepo.save(dispositivo);
    }

    const nuevo = this.dispositivoRepo.create({
      usuario: { id: usuarioId },
      device_id,
      ultimoAcceso: new Date(),
    } as Partial<Dispositivo>);
    return this.dispositivoRepo.save(nuevo);
  }

  async obtenerMiPerfil(usuarioId: string) {
    return this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: ['rol'],
      select: ['id', 'email', 'nombre', 'telefono', 'avatarUrl', 'emailVerificado', 'activo', 'createdAt'],
    });
  }

  // List users excluding those with role 'cliente' (for supervisor use)
  async listarUsuariosExcluyendoClientes() {
    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'r')
      .where('LOWER(r.nombre) <> :cliente', { cliente: 'cliente' })
      .select([
        'u.id',
        'u.email',
        'u.nombre',
        'u.telefono',
        'u.avatarUrl',
        'u.emailVerificado',
        'u.activo',
        'u.createdAt',
        'r.id',
        'r.nombre',
      ])
      .getMany();

    return usuarios;
  }

  // List users that are vendedores (role name 'vendedor' or rol id 4)
  async listarVendedores() {
    const vendedores = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'r')
      .where('LOWER(r.nombre) = :vendedor OR r.id = :vid', { vendedor: 'vendedor', vid: 4 })
      .select([
        'u.id',
        'u.email',
        'u.nombre',
        'u.telefono',
        'u.avatarUrl',
        'u.emailVerificado',
        'u.activo',
        'u.createdAt',
        'r.id',
        'r.nombre',
      ])
      .getMany();

    return vendedores;
  }

  // List users that are deactivated (activo = false)
  async listarUsuariosDesactivados() {
    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'r')
      .where('u.activo = false')
      .select([
        'u.id',
        'u.email',
        'u.nombre',
        'u.telefono',
        'u.avatarUrl',
        'u.emailVerificado',
        'u.activo',
        'u.createdAt',
        'r.id',
        'r.nombre',
      ])
      .getMany();

    return usuarios;
  }

  // Deactivate a user. Supervisors/admins can deactivate other users (admins protected).
  async desactivarUsuario(usuarioId: string, requester?: { sub?: string; role?: string | string[]; rolId?: number }) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const rolNombreTarget = String(usuario.rol?.nombre || '').toLowerCase();

    const requesterRoles = Array.isArray(requester?.role)
      ? requester.role.map((r) => String(r).toLowerCase())
      : [String(requester?.role || '').toLowerCase()];
    const isSupervisor = requesterRoles.includes('supervisor') || requester?.rolId === 2;
    const isAdmin = requesterRoles.includes('admin') || requester?.rolId === 1;

    // If requester is admin, allow any deactivation
    if (isAdmin) {
      await this.usuarioRepo.update(usuarioId, { activo: false } as Partial<Usuario>);
      return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    }

    // Supervisor may deactivate non-admin users
    if (isSupervisor) {
      if (rolNombreTarget === 'admin') throw new BadRequestException('No autorizado para desactivar administradores');
      await this.usuarioRepo.update(usuarioId, { activo: false } as Partial<Usuario>);
      return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    }

    // Default: only allow deactivating clientes (backwards-compatible)
    if (rolNombreTarget !== 'cliente' && usuario.rol?.id !== 3) {
      throw new BadRequestException('Sólo se pueden desactivar usuarios con rol cliente');
    }

    await this.usuarioRepo.update(usuarioId, { activo: false } as Partial<Usuario>);
    return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
  }

  async activarUsuario(usuarioId: string, requester?: { sub?: string; role?: string | string[]; rolId?: number }) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const rolNombreTarget = String(usuario.rol?.nombre || '').toLowerCase();

    const requesterRoles = Array.isArray(requester?.role)
      ? requester.role.map((r) => String(r).toLowerCase())
      : [String(requester?.role || '').toLowerCase()];
    const isSupervisor = requesterRoles.includes('supervisor') || requester?.rolId === 2;
    const isAdmin = requesterRoles.includes('admin') || requester?.rolId === 1;

    if (isAdmin) {
      await this.usuarioRepo.update(usuarioId, { activo: true } as Partial<Usuario>);
      return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    }

    if (isSupervisor) {
      if (rolNombreTarget === 'admin') throw new BadRequestException('No autorizado para activar administradores');
      await this.usuarioRepo.update(usuarioId, { activo: true } as Partial<Usuario>);
      return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    }

    if (rolNombreTarget !== 'cliente' && usuario.rol?.id !== 3) {
      throw new BadRequestException('Sólo se pueden activar usuarios con rol cliente');
    }

    await this.usuarioRepo.update(usuarioId, { activo: true } as Partial<Usuario>);
    return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
  }

  // Update user with role-change protections: a cliente cannot change role or update other users
  async actualizarUsuario(
    usuarioId: string,
    dto: Partial<CreateUsuarioDto>,
    requester: { sub?: string; role?: string | string[]; rolId?: number },
  ) {
    const target = await this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    const requesterRoles = Array.isArray(requester?.role)
      ? requester.role.map((r) => String(r).toLowerCase())
      : [String(requester?.role || '').toLowerCase()];
    const isCliente = requesterRoles.includes('cliente') || requester?.rolId === 6;

    if (isCliente) {
      // Clientes may only update their own profile
      if (String(requester.sub) !== String(usuarioId)) throw new ForbiddenException('No autorizado');
      // Prevent role escalation: strip role/rolId if present
      if ('rolId' in dto) delete dto.rolId;
      if ('password' in dto) delete dto.password; // password change should use dedicated flow
    }

    // If non-cliente, allow updates but do not permit setting arbitrary rolId to invalid value
    if ('rolId' in dto && dto.rolId) {
      const rol = await this.roleRepo.findOne({ where: { id: dto.rolId } });
      if (!rol) throw new BadRequestException('Rol no válido');
      // assignable
    }

    // Only allow certain fields to be updated directly
    const up: Partial<Usuario> = {};
    if (dto.nombre !== undefined) up.nombre = dto.nombre;
    if ((dto as CreateUsuarioDto).telefono !== undefined) up.telefono = (dto as CreateUsuarioDto).telefono;
    if ((dto as CreateUsuarioDto).avatarUrl !== undefined) up.avatarUrl = (dto as CreateUsuarioDto).avatarUrl;
    if ('emailVerificado' in dto) up.emailVerificado = (dto as CreateUsuarioDto).emailVerificado as boolean;
    if ('activo' in dto) up.activo = (dto as CreateUsuarioDto).activo as boolean;
    if ('rolId' in dto && dto.rolId) up.rol = { id: dto.rolId } as unknown as Role;

    await this.usuarioRepo.update(usuarioId, up as Partial<Usuario>);
    return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
  }

  async refreshTokens(providedRefreshToken: string, deviceId?: string, ip?: string, userAgent?: string) {
    // Fetch all tokens (revoked or not) and compare to detect reuse
    const candidatos = await this.tokenRepo.find();

    let matched: AuthRefreshToken | null = null;
    for (const c of candidatos) {
      // skip clearly expired tokens
      if (c.fechaExpiracion && c.fechaExpiracion.getTime() < Date.now()) continue;
      const ok = await bcrypt.compare(providedRefreshToken, c.token_hash);
      if (!ok) continue;

      // If token matches but is revoked -> reuse detected
      if (c.revocado) {
        // revoke all tokens for that user immediately
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

      // otherwise matched and not revoked -> normal rotation
      matched = c;
      break;
    }

    if (!matched) throw new UnauthorizedException('Refresh token inválido o revocado');

    // Rotate: revoke matched token and issue a new refresh token
    matched.revocado = true;
    matched.revocadoRazon = 'rotated';
    await this.tokenRepo.save(matched);

    const usuario = await this.usuarioRepo.findOne({ where: { id: matched.usuario.id }, relations: ['rol'] });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    // Issue new access + refresh
    const accessPayload = { sub: usuario.id, email: usuario.email, role: usuario.rol?.nombre };
    const accessTtl = process.env.ACCESS_TOKEN_TTL || '12h';
    const parseDuration = (v: string) => {
      const s = v.toString().trim().toLowerCase();
      if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
      const n = parseInt(s.slice(0, -1), 10);
      if (s.endsWith('m')) return n * 60;
      if (s.endsWith('h')) return n * 3600;
      if (s.endsWith('d')) return n * 86400;
      return parseInt(s, 10) || 600;
    };
    const accessSeconds = parseDuration(accessTtl);
    const access_token = this.jwtService.sign(accessPayload, { expiresIn: accessSeconds });

    const refreshTtl = process.env.REFRESH_TOKEN_TTL || '7d';
    const refreshSeconds = parseDuration(refreshTtl);
    const refresh_token = this.jwtService.sign({ sub: usuario.id, type: 'refresh' }, { expiresIn: refreshSeconds });

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
      ip: ip,
      user_agent: userAgent,
      metadata: { descripcion: 'Refresh token rotado' },
    });

    return { access_token, refresh_token };
  }
}