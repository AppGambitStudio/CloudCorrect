import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
    dialect: 'postgres',
    logging: false,
});

// Models

export class Tenant extends Model {
    public id!: string;
    public name!: string;
}

Tenant.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Tenant',
    }
);

export class User extends Model {
    public id!: string; // Primary Key
    public email!: string;
    public password!: string;
    public tenantId!: string;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'User',
    }
);

export class AWSAccount extends Model {
    public id!: string;
    public tenantId!: string;
    public awsAccountId!: string;
    public name!: string;
    public authMethod!: 'ROLE' | 'KEYS';
    public roleArn?: string;
    public externalId?: string;
    public accessKeyId?: string;
    public secretAccessKey?: string;
    public region?: string; // Default region for the account (especially for keys)
}

AWSAccount.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        awsAccountId: {
            type: DataTypes.STRING(12),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        authMethod: {
            type: DataTypes.ENUM('ROLE', 'KEYS'),
            defaultValue: 'ROLE',
            allowNull: false,
        },
        roleArn: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        externalId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        accessKeyId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        secretAccessKey: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        region: {
            type: DataTypes.STRING,
            defaultValue: 'us-east-1',
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'AWSAccount',
    }
);

export class InvariantGroup extends Model {
    public id!: string;
    public tenantId!: string;
    public awsAccountId!: string; // Local AWSAccount table reference
    public name!: string;
    public description?: string;
    public intervalMinutes!: number;
    public enabled!: boolean;
    public lastStatus!: 'PASS' | 'FAIL' | 'PENDING';
    public lastEvaluatedAt?: Date;
    public notificationEmails?: string;
    public AWSAccount?: AWSAccount;
}

InvariantGroup.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        awsAccountId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        intervalMinutes: {
            type: DataTypes.INTEGER,
            defaultValue: 5,
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        lastStatus: {
            type: DataTypes.ENUM('PASS', 'FAIL', 'PENDING'),
            defaultValue: 'PENDING',
        },
        lastEvaluatedAt: {
            type: DataTypes.DATE,
        },
        notificationEmails: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'InvariantGroup',
    }
);

export class Check extends Model {
    public id!: string;
    public groupId!: string;
    public service!: 'EC2' | 'ALB' | 'Route53' | 'IAM' | 'S3' | 'NETWORK' | 'RDS' | 'ECS';
    public scope!: 'GLOBAL' | 'REGIONAL';
    public region?: string;
    public type!: string;
    public parameters!: any;
    public alias?: string;
    public deletedAt?: Date;
}

Check.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        service: {
            type: DataTypes.ENUM('EC2', 'ALB', 'Route53', 'IAM', 'S3', 'NETWORK'),
            allowNull: false,
        },
        scope: {
            type: DataTypes.ENUM('GLOBAL', 'REGIONAL'),
            allowNull: false,
        },
        region: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        parameters: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        alias: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Check',
        paranoid: true,
    }
);

export class EvaluationRun extends Model {
    public id!: string;
    public groupId!: string;
    public status!: 'PASS' | 'FAIL';
    public evaluatedAt!: Date;
}

EvaluationRun.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('PASS', 'FAIL'),
            allowNull: false,
        },
        evaluatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        modelName: 'EvaluationRun',
    }
);

export class CheckResultLog extends Model {
    public id!: string;
    public runId!: string;
    public checkId!: string;
    public status!: 'PASS' | 'FAIL';
    public expected!: string;
    public observed!: string;
    public reason!: string;
}

CheckResultLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        runId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        checkId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('PASS', 'FAIL'),
            allowNull: false,
        },
        expected: {
            type: DataTypes.TEXT,
        },
        observed: {
            type: DataTypes.TEXT,
        },
        reason: {
            type: DataTypes.TEXT,
        },
    },
    {
        sequelize,
        modelName: 'CheckResultLog',
    }
);

// Associations
Tenant.hasMany(AWSAccount, { foreignKey: 'tenantId' });
AWSAccount.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(InvariantGroup, { foreignKey: 'tenantId' });
InvariantGroup.belongsTo(Tenant, { foreignKey: 'tenantId' });

AWSAccount.hasMany(InvariantGroup, { foreignKey: 'awsAccountId' });
InvariantGroup.belongsTo(AWSAccount, { foreignKey: 'awsAccountId' });

InvariantGroup.hasMany(Check, { foreignKey: 'groupId', as: 'checks' });
Check.belongsTo(InvariantGroup, { foreignKey: 'groupId' });

InvariantGroup.hasMany(EvaluationRun, { foreignKey: 'groupId', as: 'history' });
EvaluationRun.belongsTo(InvariantGroup, { foreignKey: 'groupId' });

EvaluationRun.hasMany(CheckResultLog, { foreignKey: 'runId', as: 'results' });
CheckResultLog.belongsTo(EvaluationRun, { foreignKey: 'runId' });

CheckResultLog.belongsTo(Check, { foreignKey: 'checkId', as: 'check' });
Check.hasMany(CheckResultLog, { foreignKey: 'checkId' });

export const initDB = async () => {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database connected and synced');
};

export default sequelize;
