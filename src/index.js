const express = require("express");
const cors = require("cors");

const { v4: uuiDv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccountMiddleware(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found!" });
  }

  request.userToken = user;

  return next();
}

app.post("/users", (request, response) => {
  const { username, name } = request.body;
  const id = uuiDv4();

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "Username already exists!" });
  }

  const userEntity = {
    id,
    name,
    username,
    todos: [],
  };

  users.push(userEntity);

  return response.status(201).json(userEntity);
});

app.get("/todos", checksExistsUserAccountMiddleware, (request, response) => {
  const { userToken } = request;

  return response.json(userToken.todos);
});

app.post("/todos", checksExistsUserAccountMiddleware, (request, response) => {
  const { title, deadline } = request.body;
  const { userToken } = request;
  const id = uuiDv4();

  const indexOfUser = users.findIndex(user => user.id === userToken.id)

  const toDoAlreadyExists = userToken.todos.findIndex(
    (to_do) => to_do.title === title
  );

  if (toDoAlreadyExists) {
    return response
      .status(400)
      .json({ error: "Title already exists on this user's to-do list!" });
  }

  const toDoEntity = {
    id,
    title,
    done: false,
    deadline: new Date(deadline),
    create_at: new Date(),
  };

  users[indexOfUser].todos.push(toDoEntity);

  return response.status(201).json(toDoEntity);
});

app.put(
  "/todos/:id",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { userToken } = request;
    const { id } = request.params;
    const { title, deadline } = request.body;

    const indexOfUser = users.findIndex(user => user.id === userToken.id)

    const indexOfToDo = userToken.todos.findIndex((toDo) => toDo.id === id);

    if (indexOfToDo === -1) {
      return response.status(404).json({ error: "To-do list not found!" });
    }

    users[indexOfUser].todos[indexOfToDo].title = title;
    users[indexOfUser].todos[indexOfToDo].deadline = new Date(deadline);

    return response.status(201).send();
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { userToken } = request;
    const { id } = request.params;

    const indexOfUser = users.findIndex(user => user.id === userToken.id)

    const indexOfToDo = userToken.todos.findIndex((toDo) => toDo.id === id);

    if (indexOfToDo === -1) {
      return response.status(404).json({ error: "To-do list not found!" });
    }

    users[indexOfUser].todos[indexOfToDo].done = true;

    return response.status(201).send();
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { userToken } = request;
    const { id } = request.params;

    const indexOfUser = users.findIndex(user => user.id === userToken.id)

    const toDo = userToken.todos.find((toDo) => toDo.id === id);

    if (!toDo) {
      return response.status(404).json({ error: "To-do list not found!" });
    }

    users[indexOfUser].todos.splice(toDo, 1)

    return response.status(201).send();
  }
);

module.exports = app;
