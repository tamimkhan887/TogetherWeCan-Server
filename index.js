import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


let client = null;
let clientPromise = null;

export async function getDb() {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    throw new Error("MONGODB_URL environment variable is not defined");
  }

  const isConnected = client && client.topology && client.topology.s?.state === "connected";
  if (!isConnected) {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }

  try {
    await clientPromise;
    return client.db("TogetherWeCan");
  } catch (err) {
    client = null;
    clientPromise = null;
    throw err;
  }
}

function getCollection(name) {
  return new Proxy({}, {
    get(target, prop) {
      if (!client) {
        throw new Error(`Database is not connected. Attempted to access collection '${name}.${String(prop)}'`);
      }
      const col = client.db("TogetherWeCan").collection(name);
      const val = col[prop];
      return typeof val === "function" ? val.bind(col) : val;
    }
  });
}

const eventsCollection = getCollection("upcomingEvents");
const joinedCollection = getCollection("joinedEvents");

// Middleware to ensure DB is connected before handling any API routes
app.use(async (req, res, next) => {
  if (req.path === "/") {
    return next();
  }
  try {
    await getDb();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    return res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send({ message: `Api Is Running` });
});

app.get("/upcomingevents", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await eventsCollection
      .find({
        date: { $gte: today },
      })
      .sort({ date: 1 })
      .limit(6)
      .toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/pastevents", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await eventsCollection
      .find({
        date: { $lt: today },
      })
      .sort({ date: -1 })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error("Error fetching past events:", error);
    res.status(500).send({ message: error.message });
  }
});

const verifytoken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  if (!process.env.ForntEND_URL) {
    return res.status(500).send({ message: "ForntEND_URL environment variable is not configured" });
  }
  try {
    const JWKS = createRemoteJWKSet(new URL(`${process.env.ForntEND_URL}/api/auth/jwks`));
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).send({ message: "Unauthorized: Invalid token" });
  }
};
const verifyTokenForEmail = (req, res, next) => {
  const { idOrEmail } = req.params;

  if (idOrEmail.includes("@")) {
    return verifytoken(req, res, next);
  }

  next();
};

app.get("/upcomingevents/:idOrEmail", verifyTokenForEmail, async (req, res) => {
  try {
    const { idOrEmail } = req.params;
    if (idOrEmail.includes("@") || !ObjectId.isValid(idOrEmail)) {
      const today = new Date().toISOString().split("T")[0];
      const result = await eventsCollection
        .find({
          organizerEmail: idOrEmail,
          date: { $gte: today },
        })
        .sort({ date: 1 })
        .toArray();
      return res.send(result);
    }

    const query = { _id: new ObjectId(idOrEmail) };
    const result = await eventsCollection.findOne(query);
    if (!result) {
      return res.status(404).send({ message: "Event not found" });
    }
    res.send(result);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).send({ message: error.message });
  }
});

app.patch("/upcomingevents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, ...updatedData } = req.body;

    if (updatedData.maxCapacity) {
      updatedData.maxCapacity = Number(updatedData.maxCapacity);
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: updatedData,
    };

    const result = await eventsCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).send({ message: error.message });
  }
});

app.delete("/upcomingevents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: new ObjectId(id) };
    const result = await eventsCollection.deleteOne(filter);
    res.send(result);
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send({ message: error.message });
  }
});

app.post("/upcomingevents", verifytoken, async (req, res) => {
  try {
    const eventData = req.body;
    const result = await eventsCollection.insertOne(eventData);
    res.send(result);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).send({ message: error.message });
  }
});

// Join Event Endpoint
app.post("/joinedevents", async (req, res) => {
  try {
    const joinData = req.body;
    const { eventId, userEmail } = joinData;

    if (!eventId || !userEmail) {
      return res.status(400).send({ message: "eventId and userEmail are required!" });
    }

    // Check if event exists and if user is the organizer
    let targetEvent = null;
    if (ObjectId.isValid(eventId)) {
      targetEvent = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    }

    if (targetEvent) {
      const organizerEmail = targetEvent.organizerEmail || "";
      if (organizerEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()) {
        return res.status(400).send({
          message: "Organizers cannot join their own event as a volunteer!",
        });
      }

      if (targetEvent.date) {
        const today = new Date().toISOString().split("T")[0];
        if (targetEvent.date < today) {
          return res.status(400).send({
            message: "Registrations are closed because this event has already concluded!",
          });
        }
      }
    }

    const existing = await joinedCollection.findOne({
      eventId: joinData.eventId,
      userEmail: joinData.userEmail,
    });

    if (existing) {
      return res.status(400).send({ message: "You have already joined this event!" });
    }

    const eventPayload = {
      eventId: joinData.eventId,
      userEmail: joinData.userEmail,
      userName: joinData.userName || "Community Volunteer",
      userAvatar: joinData.userAvatar || "",
      eventTitle: joinData.eventTitle || targetEvent?.title || "Community Event",
      eventDate: joinData.eventDate || targetEvent?.date || new Date().toISOString(),
      eventLocation: joinData.eventLocation || targetEvent?.location || "TBD",
      eventImage: joinData.eventImage || targetEvent?.image || "",
      eventCategory: joinData.eventCategory || targetEvent?.category || "Other",
      organizerName: joinData.organizerName || targetEvent?.organizerName || "Organizer",
      organizerEmail: joinData.organizerEmail || targetEvent?.organizerEmail || "",
      joinedAt: new Date().toISOString(),
    };

    const result = await joinedCollection.insertOne(eventPayload);

    res.send({
      success: true,
      insertedId: result.insertedId,
      message: "Successfully joined event!",
      data: eventPayload,
    });
  } catch (error) {
    console.error("Error joining event:", error);
    res.status(500).send({ message: error.message });
  }
});

app.delete("/joinedevents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { eventId: id };
    }
    const result = await joinedCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.error("Error cancelling joined event:", error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/joinedevents/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await joinedCollection.find({ eventId }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/joinedevents/:email", verifytoken, async (req, res) => {
  try {
    const { email } = req.params;
    const result = await joinedCollection
      .find({ userEmail: email })
      .sort({ eventDate: 1, joinedAt: -1 })
      .toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching joined events:", error);
    res.status(500).send({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;
