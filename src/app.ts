import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;
dotenv.config();

// Function to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Middleware to validate JWT token
// eslint-disable-next-line @typescript-eslint/ban-types
const verifyToken = (req: CustomRequest, res: Response, next: Function) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded as UserPayload;
    next();
  });
};

// Custom interface extending Request
interface CustomRequest extends Request {
  user?: UserPayload;
}

interface UserPayload {
  email: string;
}

app.post('/register', async (req: Request, res: Response) => {
  const credentials = req.body;

  try {
    // Generate a salt for password hashing
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    // Encrypt the password with the salt and the KEY from .env
    const encryptedPassword = await bcrypt.hash(
      credentials.password,
      `${salt}${process.env.KEY}`
    );

    await prisma.user.create({
      data: {
        email: credentials.email,
        username: credentials.username,
        password: encryptedPassword,
      },
    });

    res.send('Registration successful').status(200);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during registration');
  }
});

app.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Query the user with the provided email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Check if the user exists and compare the passwords
  if (user && (await bcrypt.compare(password, user.password))) {
    // Successful login
    const payload = { email: user.email }; // Customize the payload as needed
    const token = generateToken(payload);
    res.status(200).json({ message: 'Login successful', token });
  } else {
    // Failed login
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/addTodo', verifyToken, async (req: CustomRequest, res: Response) => {
  const { todoName } = req.body;
  const { email } = req.user as UserPayload; // Access the email from the decoded token

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new todo item in the database
    const newTodo = await prisma.todo.create({
      data: {
        author: { connect: { email: email } },
        title: todoName,
        finished: false,
      },
    });

    res.status(200).json(newTodo);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while adding a todo');
  }
});

app.post('/todos', verifyToken, async (req: CustomRequest, res: Response) => {
  const { email } = req.user as UserPayload; // Access the email from the decoded token
  try {
    const todos = await prisma.todo.findMany({
      where: { author: { email } },
    });
    res.status(200).json({ todos });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while retrieving todos');
  }
});

app.put('/todos/:id', verifyToken, async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { finished } = req.body;

  try {
    // Update the todo in the database
    const updatedTodo = await prisma.todo.update({
      where: {
        id: parseInt(id),
      },
      data: {
        finished: finished,
      },
    });

    res.json(updatedTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the todo' });
  }
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
