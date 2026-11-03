import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

connectToMongoDB();

const db = client.db("TogetherWeCan");
const eventsCollection = db.collection("upcomingEvents");
const joinedCollection = db.collection("joinedEvents");

app.get("/", (req, res) => {
  res.send({ message: `Api Is Running` });
});

app.get("/upcomingevents", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const result = await eventsCollection
    .find({
      date: { $gte: today },
    })
    .sort({ date: 1 })
    .toArray();

  res.send(result);
});

app.get("/pastevents", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await eventsCollection
    .find({
      date: { $lt: today },
    })
    .sort({ date: 1 })
    .toArray();

  res.send(result);
})

app.get("/upcomingevents/:email", async (req, res) => {
  const email = req.params.email;
  const today = new Date().toISOString().split("T")[0];
  const result = await eventsCollection
    .find({
      organizerEmail: email,
      date: { $gte: today },
    })
    .sort({ date: 1 })
    .toArray();
  res.send(result);
});


app.post("/upcomingevents", async (req, res) => {
  const eventData = req.body;
  const result = await eventsCollection.insertOne(eventData)
  res.send(result)
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})