const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT;
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const cookieParser = require("cookie-parser");

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

const JWS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwt/jwks`));

// User Token verify middleware
const userTokenVerify = async (req, res, next) => {
  // const token = req.headers.token;
  const token = req.cookies['__Secure-better-auth.session_data'];
  // console.log(token);

  if (!token) {
    return res.status(401).json({
      message: "Invalid User",
    });
  }
  next();
  // try {
  //   const { payload } = await jwtVerify(token, JWS);
  //   if (payload) {
  //     next();
  //   }
  // } catch (err) {
  //   res.status(401).json({
  //     message: err.message,
  //   });
  // }
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let database;

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
    database = client.db("ThinkShare");
  } catch (err) {
    console.log(err.message);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running..");
});

// CREATE IDEA
app.post("/create-idea", userTokenVerify, async (req, res) => {
  try {
    // Convert array and then save to DB
    const tag = req.body.tags.split(",");
    req.body.tags = tag;

    const result = await database.collection("ideas").insertOne(req.body);
    res.status(201).json({
      message: "Idea post successful.",
      data: result,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// READ IDEA with limit for the home page rendering
app.get("/read-idea", async (req, res) => {
  try {
    const ideas = await database.collection("ideas").find().limit(6).toArray();

    res.status(200).json({
      message: "Idea Fatch Successful.",
      data: ideas,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// READ IDEA without condition
app.get("/read-idea-all", userTokenVerify, async (req, res) => {
  const ideas = await database.collection("ideas").find().toArray();

  res.status(200).json({
    message: "Idea fetch successful.",
    data: ideas,
  });
});

// UPDATED IDEA
app.put("/idea-update/:id", userTokenVerify, async (req, res) => {
  // get the id from the params
  const query = { _id: new ObjectId(req.params.id) };

  try {
    // Convert array and then save to DB
    const tag = req.body.tags.split(",");
    req.body.tags = tag;

    const updated = await database
      .collection("ideas")
      .findOneAndUpdate(query, { $set: req.body });

    res.status(200).json({
      message: "Idea updated successful",
      success: true,
    });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
});

// Find Specif idea
app.get("/idea/:id", userTokenVerify, async (req, res) => {
  const id = new ObjectId(req.params.id);
  try {
    const result = await database.collection("ideas").findOne({ _id: id });

    res.status(200).json({
      message: "All idea fetch successful.",
      data: result,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// Delete Idea
app.delete("/idea-delete/:id",userTokenVerify, async (req, res) => {
  try {
    // get the id from the params for create new _id
    const query = { _id: new ObjectId(req.params.id) };

    // delete specific idea with the query
    const result = await database.collection("ideas").deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Idea not found. Nothing was deleted.",
      });
    }

    res.status(200).json({
      message: "Idea Delete Successful.",
      data: result,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// Find my idea with author id
app.get("/my-ideas/:id", userTokenVerify, async (req, res) => {
  try {
    const id = req.params.id;
    const ideas = await database
      .collection("ideas")
      .find({
        author_id: id,
      })
      .toArray();

    res.status(200).json({
      message: "Fetch successful.",
      data: ideas,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// Post comment
app.post("/comment", userTokenVerify, async (req, res) => {
  try {
    const result = await database.collection("comment").insertOne(req.body);
    // success response
    res.status(201).json({
      message: "Comment post successful",
      data: result,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// Get Comment with post id
app.get("/comment/:id",userTokenVerify, async (req, res) => {
  try {
    const comments = await database
      .collection(`comment`)
      .find({ postID: req.params.id })
      .toArray();

    res.status(200).json({
      message: "Comment fetch successful.",
      data: comments,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// Get Comment with comment id
app.get("/comments/:id",userTokenVerify, async (req, res) => {
  const id = new ObjectId(req.params.id);
  try {
    const comments = await database
      .collection(`comment`)
      .find({ _id: id })
      .toArray();

    res.status(200).json({
      message: "Comment fetch successful.",
      data: comments,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// Get Comment with user id
app.get("/comments-userID/:id",userTokenVerify, async (req, res) => {
  try {
    const comments = await database
      .collection(`comment`)
      .find({ userID: req.params.id })
      .toArray();

    res.status(200).json({
      message: "Comment fetch successful.",
      data: comments,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

// UPDATED comment
app.put("/comments/:id",userTokenVerify, async (req, res) => {
  // get the id from the params
  const query = { _id: new ObjectId(req.params.id) };
  console.log(req.body.text);
  try {
    const updated = await database
      .collection("comment")
      .findOneAndUpdate(query, { $set: { text: req.body.text } });

    res.status(200).json({
      message: "Idea updated successful",
      success: true,
    });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
});

// Delete comment
app.delete("/comment-delete/:id",userTokenVerify, async (req, res) => {
  try {
    // get the id from the params for create new _id
    const query = { _id: new ObjectId(req.params.id) };

    // delete specific idea with the query
    const result = await database.collection("comment").deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Idea not found. Nothing was deleted.",
      });
    }

    res.status(200).json({
      message: "Idea Delete Successful.",
      data: result,
    });
  } catch (err) {
    res.status(403).json({
      message: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
