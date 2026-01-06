import { Tenant, User, AWSAccount } from '../db';
import bcrypt from 'bcryptjs';

export const createTenantForUser = async (email: string, password: string, tenantName: string) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    const tenant = await Tenant.create({
        name: tenantName,
    });

    const user = await User.create({
        email,
        password: hashedPassword,
        tenantId: tenant.id,
    });

    return { tenant, user };
};

export const authenticateUser = async (email: string, password: string) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw new Error('Invalid password');
    }

    return user;
};

export const getTenantDetails = async (tenantId: string) => {
    const tenant = await Tenant.findByPk(tenantId, {
        include: [AWSAccount],
    });
    return tenant;
};
