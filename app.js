const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(cors());

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
app.post("/create-idea", async (req, res) => {
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















app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
