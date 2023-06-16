"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const port = process.env.PORT;
dotenv_1.default.config();
app.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const credentials = req.body;
    try {
        // Generate a salt for password hashing
        const saltRounds = 10;
        const salt = yield bcrypt_1.default.genSalt(saltRounds);
        // Encrypt the password with the salt and the KEY from .env
        const encryptedPassword = yield bcrypt_1.default.hash(credentials.password, `${salt}${process.env.KEY}`);
        const user = yield prisma.user.create({
            data: {
                email: credentials.email,
                username: credentials.username,
                password: encryptedPassword,
            },
        });
        console.log(user);
        res.send('Registration successful').status(200);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during registration');
    }
}));
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // Query the user with the provided email
    const user = yield prisma.user.findUnique({
        where: { email },
    });
    // Check if the user exists and compare the passwords
    if (user && (yield bcrypt_1.default.compare(password, user.password))) {
        // Successful login
        res.status(200).json({ message: 'Login successful' });
    }
    else {
        // Failed login
        res.status(401).json({ message: 'Invalid credentials' });
    }
}));
app.post('/addTodo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, todoName } = req.body;
    try {
        // Check if the user exists
        const user = yield prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Create a new todo item in the database
        const newTodo = yield prisma.todo.create({
            data: {
                author: { connect: { email: email } },
                title: todoName,
                finished: false,
            }, // Explicitly define the type as TodoCreateInput
        });
        res.status(200).json(newTodo);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while adding a todo');
    }
}));
app.post('/todos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const todos = yield prisma.todo.findMany({
            where: { author: { email } },
        });
        res.status(200).json({ todos });
    }
    catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while adding a todo');
    }
}));
app.put('/todos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { finished } = req.body;
    try {
        // Update the todo in the database
        const updatedTodo = yield prisma.todo.update({
            where: {
                id: parseInt(id),
            },
            data: {
                finished: finished,
            },
        });
        res.json(updatedTodo);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the todo' });
    }
}));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map