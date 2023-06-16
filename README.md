# Todo App back-end

## Description

This is the backend for a todo application. It serves login/register and todo list management.

## Setup

- To setup this project you need Node.js installed
- Run the command ``` npm install ``` in the terminal to install dependencies
- You need to make a ```.env``` file with the enviroment variables. Assign values for ```PORT```, ```DATABASE_URL``` and ```KEY```.
You can assign
```
PORT=3000
DATABSE_URL="file:./dev.db"
KEY="DEMOKEY"
```
- Run command ``` npx prisma generate ``` to initiate the database.
- Run command ``` npm run start ``` in the terminal to start the server on the port you assigned

## Dependencies

- bycrypt
- prisma.js
- express.js
- dotenv
- bodyparser

## API's

### POST /register

A post API, takes username, email, password in the request body, it then encrypts the passwords using the private key in the .env file then created new input at the prisma.js database. Sends reponse with status 200.

### POST /login

A post API, takes email and password in the request body. If there is an account with that email, it checks its password with the given password without decrypting it, if they match a reponse with status 200 is sent.

### POST /todos

A post API, takes user email as input, makes prisma.js query to retrieve all todos for the user with that email. Returns todos in the response body.

### PUT /todo/:id

A PUT API, takes finished as input and updates status of the todo with the specified id to the finished status. Sends response status 200.

### POST /addTodo

A POST API, takes user email and todo title as input, adds todo item with finished as false to the user with that email. Sends response status 200.

## Process description

The server runs using express.js, when the user registers, using the ```/register``` API, their password is encrypted using the secret key a new account is created.
When the user logs in using ```/login``` API, if their email matches an email we have the password for that account is retrieved and checked with that password they wrote without decrypting the original password.
When the home page is loaded all the users todo items are loaded using the ```/todos``` API, which asks primsa.js to retrieve all the todos associated with that account.
If the user marks a todo item as finished or unfinished, the put API at ```/todo/:id``` is called and the item is updated.
Finally if the user adds a new todo item the API at ```/addTodo``` is called and the item is added to the user's account.

## Prisma.js configuration

The database used with prisma.js here is sqllite, it is stored in the dev.db file because this is a development enviroment.

### Database Schema

#### User

- id (auto increments) :int
- username :string
- email :string
- password :string
- todos :Array<Todo>

#### TODO

- id (audo increments) :int
- title :string
- finished :boolean
- author :User
- authorId :int