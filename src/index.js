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
    return response.status(400).json({ message: "User not found!" });
  }

  request.userToken = user;

  return next();
}

app.post("/users", (request, response) => {
  const { username, name } = request.body;
  const id = uuiDv4();

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ message: "Username already exists!" });
  }

  const userEntity = {
    id,
    name,
    username,
    to_dos: [],
  };

  users.push(userEntity);

  return response.status(201).json(userEntity);
});

app.get("/to-dos", checksExistsUserAccountMiddleware, (request, response) => {
  const { userToken } = request;

  return response.json(userToken.to_dos);
});

app.post("/to-dos", checksExistsUserAccountMiddleware, (request, response) => {
  const { title, deadline } = request.body;
  const { userToken } = request;
  const id = uuiDv4();

  const toDoAlreadyExists = userToken.to_dos.some(
    (to_do) => to_do.title === title
  );

  if (toDoAlreadyExists) {
    return response
      .status(400)
      .json({ message: "Title already exists on this user's to-do list!" });
  }

  const toDoEntity = {
    id,
    title,
    done: false,
    deadline: new Date(deadline),
    create_at: new Date(),
  };

  userToken.to_dos.push(toDoEntity);

  return response.status(201).json(toDoEntity);
});

app.put(
  "/to-dos/:id",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { userToken } = request;
    const { id } = request.params;
    const { title, deadline } = request.body;

    const indexOfToDo = userToken.to_dos.findIndex((toDo) => toDo.id === id);

    if (indexOfToDo === -1) {
      return response.status(400).json({ message: "To-do list not found!" });
    }

    userToken.to_dos[indexOfToDo].title = title;
    userToken.to_dos[indexOfToDo].deadline = new Date(deadline);

    return response.status(201).json(userToken.to_dos[indexOfToDo]);
  }
);

app.patch(
  "/to-dos/:id/done",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { userToken } = request;
    const { id } = request.params;

    const indexOfToDo = userToken.to_dos.findIndex((toDo) => toDo.id === id);

    if (indexOfToDo === -1) {
      return response.status(400).json({ message: "To-do list not found!" });
    }

    userToken.to_dos[indexOfToDo].done = true;

    return response.status(201).json(userToken.to_dos[indexOfToDo]);
  }
);

app.delete(
  "/to-dos/:id",
  checksExistsUserAccountMiddleware,
  (request, response) => {
    const { userToken } = request;
    const { id } = request.params;

    const toDo = userToken.to_dos.find((toDo) => toDo.id === id);

    if (!toDo) {
      return response.status(400).json({ message: "To-do list not found!" });
    }

    userToken.to_dos.splice(toDo, 1)

    return response.status(201).json(userToken.to_dos);
  }
);

module.exports = app;
