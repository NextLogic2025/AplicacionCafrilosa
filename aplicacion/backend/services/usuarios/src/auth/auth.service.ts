import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Role } from '../entities/role.entity';
import { AuthToken } from '../entities/auth-token.entity';
import { Dispositivo } from '../entities/dispositivo.entity';
import { AuthAuditoria } from '../entities/auth-auditoria.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(AuthToken) private tokenRepo: Repository<AuthToken>,
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

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { email: dto.email },
      relations: ['rol'],
    });

    // Auditoría de intento fallido
    if (!usuario || !(await bcrypt.compare(dto.password, usuario.passwordHash))) {
      await this.auditoriaRepo.save({
        evento: 'FAIL',
        ip,
        user_agent: userAgent,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.email, rolId: usuario.rol?.id };
    const access_token = this.jwtService.sign(payload);

    // Política de sesión única: revocar tokens activos anteriores
    await this.tokenRepo
      .createQueryBuilder()
      .update()
      .set({ revocado: true })
      .where('usuario_id = :uid AND revocado = false AND tipo = :tipo', { uid: usuario.id, tipo: 'access' })
      .execute();

    // Guardar el token en BD (hash por seguridad)
    const tokenHash = await bcrypt.hash(access_token, 10);
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 60 * 60 * 1000); // 1 hora

    await this.tokenRepo.save({
      usuario: { id: usuario.id },
      token_hash: tokenHash,
      tipo: 'access',
      expiracion,
    });

    // Registrar login en auditoría
    await this.auditoriaRepo.save({
      usuario_id: usuario.id,
      evento: 'LOGIN',
      ip,
      user_agent: userAgent,
    });

    // Actualizar last_login
    usuario.lastLogin = new Date();
    await this.usuarioRepo.save(usuario);

    return { access_token, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre } };
  }

  async logout(usuarioId: string, bearerToken?: string, ip?: string, userAgent?: string) {
    // Intentar revocar el token específico presentado
    if (bearerToken) {
      const activos = await this.tokenRepo.find({
        where: { usuario: { id: usuarioId }, tipo: 'access', revocado: false },
      });
      for (const t of activos) {
        const match = await bcrypt.compare(bearerToken, t.token_hash);
        if (match) {
          await this.tokenRepo.update({ id: t.id }, { revocado: true });
          break;
        }
      }
    }

    // Registrar logout en auditoría
    await this.auditoriaRepo.save({
      usuario_id: usuarioId,
      evento: 'LOGOUT',
      ip,
      user_agent: userAgent,
    });

    return { mensaje: 'Logout exitoso' };
  }

  async registrarDispositivo(usuarioId: string, device_id: string, ip?: string) {
    const dispositivo = await this.dispositivoRepo.findOne({
      where: { usuario: { id: usuarioId }, device_id },
    });

    if (dispositivo) {
      dispositivo.ip_registro = ip;
      dispositivo.lastLogin = new Date();
      return this.dispositivoRepo.save(dispositivo);
    }

    return this.dispositivoRepo.save({
      usuario: { id: usuarioId },
      device_id,
      ip_registro: ip,
    } as any);
  }

  async obtenerMiPerfil(usuarioId: string) {
    return this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: ['rol'],
      select: ['id', 'email', 'nombre', 'activo', 'createdAt'],
    });
  }
}