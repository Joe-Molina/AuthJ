import express from 'express'
// import { prisma } from './src/libs/prisma'
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
import cors from 'cors'
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken'


const app = express()
app.use(express.json())
app.use(cookieParser())
const PORT = process.env.PORT || 3002

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))

app.get('/', async (req, res) => {

    const token = req.cookies.access_token

    console.log(token)

    return res.json({ hola: 'nose' })

    // if (token) {
    //     res.json({ conect: false })
    // } else {
    //     const data = jwt.verify(token, process.env.SECRET_JWT_KEY)
    //     res.json({ conect: true, data })
    // }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.users.findFirst({
            where: {
                email: email,
            }
        });

        if (!user) {
            return res.status(409).json({ isValid: false });
        }



        const token = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET_JWT_KEY, { expiresIn: '1h' })

        // console.log(token)

        res
            .cookie('access_token', token, {
                httpOnly: true, // solo tienen acceso en el servidor
                // secure: process.env.NODE_ENV === 'production',
                // sameSite: 'strict', // la cookie solo se puede acceder en el mismo dominio
                maxAge: 1000 * 60 * 60 // la cookie solo tiene validez 1 hora
            })
            .json({ isValid: true })
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


})

app.get('/logout', async (req, res) => {
    try {
        res
            .clearCookie('access_token')
            .json('logout successfull')

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


})

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await prisma.users.findFirst({
            where: {
                email: email
            }
        });

        if (existingUser) {
            return res.status(409).json({ message: 'User already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(PORT, (req, res) => {
    console.log(`Server is running on port ${PORT}`)
})