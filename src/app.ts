import express from 'express';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client'
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient()
const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;
dotenv.config();

app.post('/register', async (req, res) => {
  const credentials = req.body;

  try {
    // Generate a salt for password hashing
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    // Encrypt the password with the salt and the KEY from .env
    const encryptedPassword = await bcrypt.hash(credentials.password, `${salt}${process.env.KEY}`);

    const user = await prisma.user.create({
      data: {
        email: credentials.email,
        username: credentials.username,
        password: encryptedPassword,
      },
    });

    console.log(user);

    res.send('Registration successful').status(200);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during registration');
  }
});
  
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Query the user with the provided email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Check if the user exists and compare the passwords
  if (user && await bcrypt.compare(password, user.password)) {
    // Successful login
    res.status(200).json({ message: 'Login successful' });
  } else {
    // Failed login
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

  app.post('/addTodo', async (req, res) => {
    const { email, todoName } = req.body;
  
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
        } as Prisma.TodoCreateInput, // Explicitly define the type as TodoCreateInput
      });
  
      res.status(200).json(newTodo);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while adding a todo');
    }
  });
  

  app.post('/todos', async (req, res) => {
    const {email} = req.body;
    try {
        const todos = await prisma.todo.findMany({
            where: { author: { email } },
        });
        res.status(200).json({todos});
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while adding a todo');
      }
    });
  
  app.put('/todos/:id', async (req, res) => {
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