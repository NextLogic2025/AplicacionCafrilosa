import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '../entities/role.entity';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}


  async obtenerMiPerfil(usuarioId: string) {
    return this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: ['rol'],
      select: ['id', 'email', 'nombreCompleto', 'telefono', 'avatarUrl', 'emailVerificado', 'activo', 'createdAt'],
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
        'u.nombreCompleto',
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
        'u.nombreCompleto',
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
        'u.nombreCompleto',
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
  async desactivarUsuario(usuarioId: string, requester?: { sub?: string; role?: string | string[]; rolId?: string | number }) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const rolNombreTarget = String(usuario.rol?.nombre || '').toLowerCase();

    const requesterRoles = Array.isArray(requester?.role)
      ? requester.role.map((r) => String(r).toLowerCase())
      : [String(requester?.role || '').toLowerCase()];
    const isSupervisor = requesterRoles.includes('supervisor') || Number(requester?.rolId) === 2;
    const isAdmin = requesterRoles.includes('admin') || Number(requester?.rolId) === 1;

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

  async activarUsuario(usuarioId: string, requester?: { sub?: string; role?: string | string[]; rolId?: string | number }) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const rolNombreTarget = String(usuario.rol?.nombre || '').toLowerCase();

    const requesterRoles = Array.isArray(requester?.role)
      ? requester.role.map((r) => String(r).toLowerCase())
      : [String(requester?.role || '').toLowerCase()];
    const isSupervisor = requesterRoles.includes('supervisor') || Number(requester?.rolId) === 2;
    const isAdmin = requesterRoles.includes('admin') || Number(requester?.rolId) === 1;

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
    dto: Partial<import('./dto/update-usuario.dto').UpdateUsuarioDto>,
    requester: { sub?: string; role?: string | string[]; rolId?: string | number },
  ) {
    const target = await this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    const requesterRoles = Array.isArray(requester?.role)
      ? requester.role.map((r) => String(r).toLowerCase())
      : [String(requester?.role || '').toLowerCase()];
    const isCliente = requesterRoles.includes('cliente') || Number(requester?.rolId) === 6;

    if (isCliente) {
      // Clientes may only update their own profile
      if (String(requester.sub) !== String(usuarioId)) throw new ForbiddenException('No autorizado');
      // Prevent role escalation: strip role/rolId if present
      if ('rolId' in dto) delete dto.rolId;
      if ('password' in dto) delete dto.password; // password change should use dedicated flow
    }

    // If non-cliente, allow updates but do not permit setting arbitrary rolId to invalid value
    // normalize incoming rolId if present
    const incoming = dto as Partial<import('./dto/update-usuario.dto').UpdateUsuarioDto>;
    if (incoming.rolId) {
      const rol = await this.roleRepo.findOne({ where: { id: incoming.rolId } });
      if (!rol) throw new BadRequestException('Rol no válido');
    }

    // Only allow certain fields to be updated directly
    const up: Partial<Usuario> = {};
    if (dto && typeof dto === 'object') {
      const d = dto as Partial<import('./dto/update-usuario.dto').UpdateUsuarioDto>;
      if (d.nombre !== undefined) up.nombreCompleto = d.nombre;
      if (d.telefono !== undefined) up.telefono = d.telefono;
      if (d.avatarUrl !== undefined) up.avatarUrl = d.avatarUrl;
      if ('emailVerificado' in d) up.emailVerificado = Boolean(d.emailVerificado);
      if ('activo' in d) up.activo = Boolean(d.activo);
      if ('rolId' in d && d.rolId) up.rol = { id: d.rolId } as Role;
    }

    await this.usuarioRepo.update(usuarioId, up as Partial<Usuario>);
    return this.usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol'] });
  }

  // Batch fetch usuarios by IDs (for internal service use)
  async obtenerUsuariosPorIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    
    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .where('u.id IN (:...ids)', { ids })
      .select(['u.id', 'u.email', 'u.nombreCompleto'])
      .getMany();

    return usuarios;
  }

  // Note: refresh/login/registration logic removed from usuarios service.
}
