import jwt from "jsonwebtoken";
import express from "express";
import { authenticateJwt, SECRET } from "../middleware/";
import { PrismaClient } from "@prisma/client";
import { signupInput } from "@100xdevs/common";

const router = express.Router();

const prisma = new PrismaClient();

router.post("/signup", async (req, res) => {
  let parsedInput = signupInput.safeParse(req.body);
  if (!parsedInput.success) {
    return res.status(403).json({
      msg: "error",
    });
  }
  const username = parsedInput.data.username;
  const password = parsedInput.data.password;

  const user = await prisma.user.findMany({
    where: {
      username: username,
    },
  });
  console.log(user);
  if (user) {
    res.status(403).json({ message: "User already exists" });
  } else {
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: password,
      },
    });

    const token = jwt.sign({ id: newUser.id }, SECRET, { expiresIn: "1h" });
    res.json({ message: "User created successfully", token });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findMany({
    where: {
      username: username,
    },
    select: {
      id: true,
    },
  });
  if (user) {
    const token = jwt.sign({ id: user[0].id }, SECRET, { expiresIn: "1h" });
    res.json({ message: "Logged in successfully", token });
  } else {
    res.status(403).json({ message: "Invalid username or password" });
  }
});

router.get("/me", authenticateJwt, async (req, res) => {
  const userId = req.headers["userId"];
  const user = await prisma.user.findUnique({
    where: {
      //@ts-ignore
      id: userId,
    },
  });
  if (user) {
    res.json({ username: user.username });
  } else {
    res.status(403).json({ message: "User not logged in" });
  }
});

export default router;
