import express, { Request, Response } from 'express';
import UserRepo from '../repos/UserRepo';

const router = express.Router();
const userRepo = new UserRepo();

router.post('/captureDonorDetails', async (req: Request, res: Response) => {
    try {
        const user = await userRepo.captureUserDonationDetails(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
});


// Extend with GET, PUT, DELETE as needed

export default router;
