import User, { IUser } from '../models/User';

export default class UserRepo {
    async captureUserDonationDetails(userDetails: Partial<IUser>): Promise<IUser> {
        const user = new User(userDetails);
        return await user.save();
    }

    async getUserByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email });
    }

    // Add additional repo methods as needed
}
