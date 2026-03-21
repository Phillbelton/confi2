import { Response } from 'express';
import { User, IUser } from '../models/User';
import { AuthRequest, ApiResponse, PaginatedResponse } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Controller para User (Gestión de usuarios por admin)
 */

// @desc    Obtener todos los usuarios con filtros
// @route   GET /api/users
// @access  Private (admin)
export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<IUser>>>) => {
    const { role, active, page = '1', limit = '20', search } = req.query;

    const query: any = {};

    if (role) {
      query.role = role;
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  }
);

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private (admin)
export const getUserById = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  }
);

// @desc    Crear usuario (funcionario o cliente) por admin
// @route   POST /api/users
// @access  Private (admin)
export const createUser = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const { name, email, password, role, phone, active } = req.body;

    // Verificar que el email no exista
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'El email ya está registrado');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      active: active !== undefined ? active : true,
    });

    // Remover password del response
    const userObj = user.toObject();
    delete (userObj as any).password;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { user: userObj },
    });
  }
);

// @desc    Actualizar usuario
// @route   PUT /api/users/:id
// @access  Private (admin)
export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const { name, email, role, phone, active } = req.body;

    // No permitir cambiar email a uno ya existente
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError(400, 'El email ya está en uso');
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (active !== undefined) user.active = active;

    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { user: userObj },
    });
  }
);

// @desc    Cambiar contraseña de usuario
// @route   PUT /api/users/:id/password
// @access  Private (admin)
export const changeUserPassword = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    const { newPassword } = req.body;

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  }
);

// @desc    Desactivar usuario (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (admin)
export const deactivateUser = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    // No permitir desactivarse a sí mismo
    if (user._id.toString() === req.user?.id) {
      throw new AppError(400, 'No puedes desactivar tu propia cuenta');
    }

    user.active = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente',
    });
  }
);

// @desc    Activar usuario
// @route   PUT /api/users/:id/activate
// @access  Private (admin)
export const activateUser = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }

    user.active = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Usuario activado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      },
    });
  }
);

// @desc    Obtener funcionarios activos
// @route   GET /api/users/funcionarios
// @access  Private (admin)
export const getFuncionarios = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse>) => {
    const funcionarios = await User.find({
      role: 'funcionario',
      active: true,
    })
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { users: funcionarios },
    });
  }
);
