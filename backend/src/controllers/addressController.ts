import { Request, Response } from 'express';
import * as AddressModel from '../models/addressModel';

// 获取用户所有地址
export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addresses = await AddressModel.getUserAddresses(userId);
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('获取地址列表失败:', error);
    res.status(500).json({ error: '获取地址列表失败' });
  }
};

// 获取单个地址
export const getAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = parseInt(req.params.id);
    
    const address = await AddressModel.getAddressById(addressId, userId);
    
    if (!address) {
      res.status(404).json({ error: '地址不存在' });
      return;
    }
    
    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('获取地址详情失败:', error);
    res.status(500).json({ error: '获取地址详情失败' });
  }
};

// 创建地址
export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { name, phone, province, city, district, detail, is_default } = req.body;
    
    if (!name || !phone || !province || !city || !district || !detail) {
      res.status(400).json({ error: '请填写完整的地址信息' });
      return;
    }
    
    const addressId = await AddressModel.createAddress({
      user_id: userId,
      name,
      phone,
      province,
      city,
      district,
      detail,
      is_default: is_default || false
    });
    
    res.status(201).json({
      success: true,
      data: { id: addressId },
      message: '地址添加成功'
    });
  } catch (error) {
    console.error('创建地址失败:', error);
    res.status(500).json({ error: '创建地址失败' });
  }
};

// 更新地址
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = parseInt(req.params.id);
    const updates = req.body;
    
    await AddressModel.updateAddress(addressId, userId, updates);
    
    res.json({
      success: true,
      message: '地址更新成功'
    });
  } catch (error) {
    console.error('更新地址失败:', error);
    res.status(500).json({ error: '更新地址失败' });
  }
};

// 删除地址
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = parseInt(req.params.id);
    
    await AddressModel.deleteAddress(addressId, userId);
    
    res.json({
      success: true,
      message: '地址删除成功'
    });
  } catch (error) {
    console.error('删除地址失败:', error);
    res.status(500).json({ error: '删除地址失败' });
  }
};

// 设置默认地址
export const setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = parseInt(req.params.id);
    
    await AddressModel.setDefaultAddress(addressId, userId);
    
    res.json({
      success: true,
      message: '已设置为默认地址'
    });
  } catch (error) {
    console.error('设置默认地址失败:', error);
    res.status(500).json({ error: '设置默认地址失败' });
  }
};
