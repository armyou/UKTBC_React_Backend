import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import userRoutes from './routes/user';
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(cors());

app.use(express.json());

// Example Route
app.get('/', (req, res) => {
    res.send('Hello World with TypeScript!');
});
app.use('/users', userRoutes);
app.use("/api", paymentRoutes);

// MongoDB Connection (Example)
mongoose.connect('mongodb://localhost:27017/uktbc')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
