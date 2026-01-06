import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDB } from './db';
import authRoutes from './routes/auth';
import awsAccountRoutes from './routes/awsAccounts';
import invariantGroupsRoutes from './routes/invariantGroups';
import { initScheduler } from './services/schedulerService';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

initDB().then(() => {
    initScheduler();
}).catch(console.error);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/aws-accounts', awsAccountRoutes);
app.use('/api/invariant-groups', invariantGroupsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
